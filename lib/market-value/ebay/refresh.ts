import prisma from "@/lib/prisma";
import { getEbayToken } from "./client";
import { collectEbayForJersey, VALUE_MARKETS, type CollectResult } from "./collect";
import { smoothEbay } from "./smoothing";
import { getRatesToEur } from "@/lib/fx";
import { ebaySearchKeywords, type JerseyForQuery } from "./matching";
import { buildRefreshQueue } from "./queue";
import { computeJerseyMarketValue } from "../compute";
import { MARKET_METHOD_VERSION } from "../config";

/**
 * Rafraîchit les données marché eBay pour les maillots POSSÉDÉS par des users
 * (là où la cote a un enjeu), sur plusieurs marketplaces, par lots pour rester
 * sous le quota Browse (~5k/j) et sous la limite de temps serverless. Priorité
 * aux maillots des Supporters non rafraîchis depuis 20 h, puis aux plus anciens.
 * Écrit uniquement des prix agrégés (aucune PII eBay).
 */

export interface EbayRefreshResult {
  processed: number;
  matched: number;
  apiCalls: number;
  stoppedByQuota: boolean;
  stoppedByTime: boolean;
}

// Budget serverless : on s'arrête bien avant le plafond Vercel (300s) pour laisser
// le temps de renvoyer la réponse. La rotation par lastSeenAt reprend là où on s'est
// arrêté à l'exécution suivante, donc tout le parc est couvert sur plusieurs runs.
const TIME_BUDGET_MS = 240_000;

interface JerseyToScan {
  jerseyId: string;
  jersey: JerseyForQuery;
}

const jerseyForQuery = {
  name: true,
  clubId: true,
  season: true,
  type: true,
  variant: true,
  club: { select: { name: true } },
} as const;

type CatalogJersey = {
  name: string;
  clubId: string;
  season: string;
  type: string;
  variant: number;
  club: { name: string };
};

/**
 * Ajoute à chaque maillot ses mots distinctifs eBay et écarte ceux qui ne sont
 * pas cherchables (variante sans mot distinctif, rétro). Les variantes sont
 * comparées au nom de leur variante 1, lu en une requête.
 */
export async function withSearchKeywords<T extends { jerseyId: string; jersey: CatalogJersey }>(
  rows: T[]
): Promise<(Omit<T, "jersey"> & { jersey: JerseyForQuery })[]> {
  const variants = rows.filter((r) => r.jersey.variant > 1);
  const bases = variants.length
    ? await prisma.jersey.findMany({
        where: {
          variant: 1,
          OR: variants.map((v) => ({ clubId: v.jersey.clubId, season: v.jersey.season, type: v.jersey.type as never })),
        },
        select: { clubId: true, season: true, type: true, name: true },
      })
    : [];
  const baseName = (j: CatalogJersey) =>
    bases.find((b) => b.clubId === j.clubId && b.season === j.season && b.type === j.type)?.name ?? null;

  const out: (Omit<T, "jersey"> & { jersey: JerseyForQuery })[] = [];
  for (const r of rows) {
    const keywords = ebaySearchKeywords(r.jersey, r.jersey.variant > 1 ? baseName(r.jersey) : null);
    if (keywords === null) continue;
    out.push({ ...r, jersey: { season: r.jersey.season, type: r.jersey.type, club: r.jersey.club, keywords } });
  }
  return out;
}

export async function refreshEbayMarketData(
  limit = 60
): Promise<EbayRefreshResult> {
  const startedAt = Date.now();
  // 1. Maillots possédés (distincts) + données catalogue pour la requête.
  const [owned, supporterOwned, existing] = await Promise.all([
    prisma.userJersey.findMany({
      distinct: ["jerseyId"],
      select: { jerseyId: true, jersey: { select: jerseyForQuery } },
    }),
    prisma.userJersey.findMany({
      where: { user: { plan: "PRO" } },
      distinct: ["jerseyId"],
      select: { jerseyId: true },
    }),
    // 2. Fraîcheur existante pour prioriser.
    prisma.ebayMarketData.findMany({
      select: { jerseyId: true, lastSeenAt: true },
    }),
  ]);
  const seenAt = new Map(existing.map((e) => [e.jerseyId, e.lastSeenAt.getTime()]));

  // Variantes, 4e maillots et éditions : cherchés avec leurs mots distinctifs, ou pas du tout.
  const queue = buildRefreshQueue(
    await withSearchKeywords(owned),
    seenAt,
    new Set(supporterOwned.map((s) => s.jerseyId)),
    startedAt,
    limit
  );

  const { result } = await scanJerseys(queue, startedAt + TIME_BUDGET_MS);
  return result;
}

/**
 * Scanne eBay pour les maillots donnés, dans l'ordre, jusqu'à la fin de la file,
 * l'épuisement du quota ou l'échéance `deadline` (timestamp ms).
 */
async function scanJerseys(
  queue: JerseyToScan[],
  deadline: number
): Promise<{ result: EbayRefreshResult; scannedIds: string[] }> {
  const token = await getEbayToken();
  const rates = await getRatesToEur();

  let matched = 0;
  let apiCalls = 0;
  let stoppedByQuota = false;
  let stoppedByTime = false;
  const scannedIds: string[] = [];

  for (const { jerseyId, jersey } of queue) {
    if (Date.now() > deadline) {
      stoppedByTime = true;
      break;
    }

    let result;
    try {
      result = await collectEbayForJersey(
        token,
        jersey,
        VALUE_MARKETS,
        rates
      );
    } catch (err) {
      if (err instanceof Error && err.message === "EBAY_RATE_LIMIT") {
        stoppedByQuota = true;
        break;
      }
      throw err;
    }

    apiCalls += result.calls;
    scannedIds.push(jerseyId);
    if (await saveEbayScan(jerseyId, result)) matched++;
  }

  return {
    result: {
      processed: scannedIds.length,
      matched,
      apiCalls,
      stoppedByQuota,
      stoppedByTime,
    },
    scannedIds,
  };
}

/**
 * Enregistre le résultat d'un scan : médiane et quartiles lissés avec le scan
 * précédent (smoothEbay), médiane brute gardée pour le suivi. Sans comparable,
 * la ligne est vidée et datée pour ne pas re-tenter le maillot en boucle.
 * Renvoie vrai si le scan a trouvé des annonces.
 */
export async function saveEbayScan(jerseyId: string, result: CollectResult): Promise<boolean> {
  const marketId = (result.marketsUsed.length ? result.marketsUsed : VALUE_MARKETS).join(",");
  const now = new Date();
  if (!result.agg) {
    await prisma.ebayMarketData.upsert({
      where: { jerseyId },
      create: { jerseyId, medianPrice: 0, sampleSize: 0, currency: "", marketId, query: result.query, methodVersion: MARKET_METHOD_VERSION },
      update: {
        lastSeenAt: now,
        sampleSize: 0,
        medianPrice: 0,
        rawMedianPrice: null,
        p25Price: null,
        p75Price: null,
        methodVersion: MARKET_METHOD_VERSION,
      },
    });
    return false;
  }
  const previous = await prisma.ebayMarketData.findUnique({
    where: { jerseyId },
    select: { medianPrice: true, p25Price: true, p75Price: true, sampleSize: true, methodVersion: true, lastSeenAt: true },
  });
  const { medianPrice, p25Price, p75Price, sampleSize, currency } = result.agg;
  const smoothed = smoothEbay(previous, { medianPrice, p25Price, p75Price }, now);
  const data = {
    ...smoothed,
    rawMedianPrice: medianPrice,
    sampleSize,
    currency,
    marketId,
    query: result.query,
    methodVersion: MARKET_METHOD_VERSION,
  };
  await prisma.ebayMarketData.upsert({
    where: { jerseyId },
    create: { jerseyId, ...data },
    update: { ...data, lastSeenAt: now },
  });
  return true;
}

const NEW_SUPPORTER_MAX_JERSEYS = 30;
const NEW_SUPPORTER_TIME_BUDGET_MS = 60_000;

/**
 * Scan immédiat d'un nouveau Supporter : ses maillots sans aucune donnée eBay,
 * puis recalcul de leur cote, pour qu'il ne tombe pas sur une page vide juste
 * après avoir payé. Le reste est pris en priorité par le cron de la nuit.
 */
export async function scanNewSupporterJerseys(userId: string): Promise<void> {
  const startedAt = Date.now();
  const queue = (
    await withSearchKeywords(
      await prisma.userJersey.findMany({
        where: { userId, jersey: { ebayMarketData: null } },
        distinct: ["jerseyId"],
        select: { jerseyId: true, jersey: { select: jerseyForQuery } },
      })
    )
  ).slice(0, NEW_SUPPORTER_MAX_JERSEYS);
  if (queue.length === 0) return;

  const { scannedIds } = await scanJerseys(queue, startedAt + NEW_SUPPORTER_TIME_BUDGET_MS);
  for (const jerseyId of scannedIds) {
    await computeJerseyMarketValue(jerseyId);
  }
}
