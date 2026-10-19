import prisma from "@/lib/prisma";
import { getEbayToken } from "./client";
import { collectEbayForJersey, VALUE_MARKETS } from "./collect";
import { getRatesToEur } from "./fx";
import type { JerseyForQuery } from "./matching";
import { buildRefreshQueue } from "./queue";
import { computeJerseyMarketValue } from "../compute";

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
  season: true,
  type: true,
  club: { select: { name: true } },
} as const;

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

  const queue = buildRefreshQueue(
    owned,
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
        { season: jersey.season, type: jersey.type, club: jersey.club },
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
    const marketId = (result.marketsUsed.length ? result.marketsUsed : VALUE_MARKETS).join(",");

    if (result.agg) {
      matched++;
      const { medianPrice, sampleSize, currency } = result.agg;
      await prisma.ebayMarketData.upsert({
        where: { jerseyId },
        create: { jerseyId, medianPrice, sampleSize, currency, marketId, query: result.query },
        update: { medianPrice, sampleSize, currency, marketId, query: result.query, lastSeenAt: new Date() },
      });
    } else {
      // Pas de comparable : on marque la date pour ne pas le re-tenter en boucle.
      await prisma.ebayMarketData.upsert({
        where: { jerseyId },
        create: { jerseyId, medianPrice: 0, sampleSize: 0, currency: "", marketId, query: result.query },
        update: { lastSeenAt: new Date(), sampleSize: 0, medianPrice: 0 },
      });
    }
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

const NEW_SUPPORTER_MAX_JERSEYS = 30;
const NEW_SUPPORTER_TIME_BUDGET_MS = 60_000;

/**
 * Scan immédiat d'un nouveau Supporter : ses maillots sans aucune donnée eBay,
 * puis recalcul de leur cote, pour qu'il ne tombe pas sur une page vide juste
 * après avoir payé. Le reste est pris en priorité par le cron de la nuit.
 */
export async function scanNewSupporterJerseys(userId: string): Promise<void> {
  const startedAt = Date.now();
  const queue = await prisma.userJersey.findMany({
    where: { userId, jersey: { ebayMarketData: null } },
    distinct: ["jerseyId"],
    take: NEW_SUPPORTER_MAX_JERSEYS,
    select: { jerseyId: true, jersey: { select: jerseyForQuery } },
  });
  if (queue.length === 0) return;

  const { scannedIds } = await scanJerseys(queue, startedAt + NEW_SUPPORTER_TIME_BUDGET_MS);
  for (const jerseyId of scannedIds) {
    await computeJerseyMarketValue(jerseyId);
  }
}
