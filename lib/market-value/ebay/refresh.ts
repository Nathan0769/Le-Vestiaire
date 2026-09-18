import prisma from "@/lib/prisma";
import { getEbayToken } from "./client";
import { collectEbayForJersey, VALUE_MARKETS } from "./collect";
import { getRatesToEur } from "./fx";

/**
 * Rafraîchit les données marché eBay pour les maillots POSSÉDÉS par des users
 * (là où la cote a un enjeu), sur plusieurs marketplaces, par lots pour rester
 * sous le quota Browse (~5k/j) et sous la limite de temps serverless. Priorité
 * aux maillots jamais/anciennement rafraîchis. Écrit uniquement des prix agrégés
 * (aucune PII eBay).
 */

export interface EbayRefreshResult {
  processed: number;
  matched: number;
  apiCalls: number;
  stoppedByQuota: boolean;
}

export async function refreshEbayMarketData(
  limit = 300
): Promise<EbayRefreshResult> {
  // 1. Maillots possédés (distincts) + données catalogue pour la requête.
  const owned = await prisma.userJersey.findMany({
    distinct: ["jerseyId"],
    select: {
      jerseyId: true,
      jersey: {
        select: {
          season: true,
          type: true,
          club: { select: { name: true } },
        },
      },
    },
  });

  // 2. Fraîcheur existante pour prioriser les plus anciens (jamais vus en premier).
  const existing = await prisma.ebayMarketData.findMany({
    select: { jerseyId: true, lastSeenAt: true },
  });
  const seenAt = new Map(existing.map((e) => [e.jerseyId, e.lastSeenAt.getTime()]));

  const queue = owned
    .sort((a, b) => (seenAt.get(a.jerseyId) ?? 0) - (seenAt.get(b.jerseyId) ?? 0))
    .slice(0, limit);

  const token = await getEbayToken();
  const rates = await getRatesToEur();

  let matched = 0;
  let apiCalls = 0;
  let stoppedByQuota = false;
  let processed = 0;

  for (const { jerseyId, jersey } of queue) {
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
    processed++;
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

  return { processed, matched, apiCalls, stoppedByQuota };
}
