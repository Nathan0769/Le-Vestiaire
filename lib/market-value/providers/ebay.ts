import prisma from "@/lib/prisma";
import type { PriceSignal } from "../types";

/**
 * Signal "prix demandé" eBay : médiane des annonces actives (Browse API), déjà
 * agrégée et convertie en EUR dans la table `EbayMarketData` par le cron
 * `refreshEbayMarketData`. Abattu asking→sold par l'agrégateur.
 * On ne lit que des prix agrégés (aucune donnée vendeur/PII eBay).
 */
export async function ebaySignals(jerseyId: string): Promise<PriceSignal[]> {
  const row = await prisma.ebayMarketData.findUnique({
    where: { jerseyId },
    select: { medianPrice: true, sampleSize: true, lastSeenAt: true },
  });
  if (!row || row.sampleSize <= 0 || row.medianPrice <= 0) return [];

  return [
    {
      price: row.medianPrice,
      type: "asking",
      source: "ebay",
      date: row.lastSeenAt,
      observations: row.sampleSize,
    },
  ];
}
