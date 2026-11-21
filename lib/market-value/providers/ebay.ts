import prisma from "@/lib/prisma";
import { isEbayComparable } from "../ebay/matching";
import type { PriceSignal } from "../types";

/**
 * Signal "prix demandé" eBay : médiane des annonces actives (Browse API), déjà
 * agrégée, convertie en EUR et ramenée à l'état GOOD dans `EbayMarketData` par
 * le cron `refreshEbayMarketData`. Abattu asking→sold par l'agrégateur.
 * Renvoie aussi la ligne (version de méthode de la collecte), null si le
 * maillot n'a pas de collecte eBay utilisable. Aucune donnée vendeur/PII eBay.
 */
export async function ebaySignals(
  jerseyId: string
): Promise<{ signals: PriceSignal[]; row: { methodVersion: number } | null }> {
  const row = await prisma.ebayMarketData.findUnique({
    where: { jerseyId },
    select: {
      medianPrice: true,
      sampleSize: true,
      lastSeenAt: true,
      methodVersion: true,
      jersey: { select: { type: true, variant: true } },
    },
  });
  if (!row || !isEbayComparable(row.jersey)) return { signals: [], row: null };
  if (row.sampleSize <= 0 || row.medianPrice <= 0) return { signals: [], row };

  return {
    row,
    signals: [
      {
        price: row.medianPrice,
        type: "asking",
        source: "ebay",
        date: row.lastSeenAt,
        observations: row.sampleSize,
      },
    ],
  };
}
