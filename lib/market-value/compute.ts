import prisma from "@/lib/prisma";
import { aggregate } from "./aggregate";
import { cfsSignals } from "./providers/cfs";
import { ebaySignals } from "./providers/ebay";
import { purchasePriceSignals } from "./providers/purchase-price";
import type { MarketEstimate, PriceSignal } from "./types";

/** Rassemble les signaux de toutes les sources pour un maillot. */
export async function collectSignals(jerseyId: string): Promise<PriceSignal[]> {
  const [purchase, cfs, ebay] = await Promise.all([
    purchasePriceSignals(jerseyId),
    cfsSignals(jerseyId),
    ebaySignals(jerseyId),
  ]);
  return [...purchase, ...cfs, ...ebay];
}

/**
 * Calcule et persiste la cote estimée d'un maillot (+ snapshot pour la tendance).
 * Renvoie l'estimation, ou null si aucun signal exploitable.
 */
export async function computeJerseyMarketValue(
  jerseyId: string
): Promise<MarketEstimate | null> {
  const signals = await collectSignals(jerseyId);
  const estimate = aggregate(signals);

  if (!estimate) {
    // Plus aucune donnée : on retire une cote éventuellement obsolète.
    await prisma.jerseyMarketValue.deleteMany({ where: { jerseyId } });
    return null;
  }

  await prisma.jerseyMarketValue.upsert({
    where: { jerseyId },
    create: {
      jerseyId,
      baseValue: estimate.baseValue,
      confidence: estimate.confidence,
      sampleSize: estimate.sampleSize,
      sources: estimate.sources,
    },
    update: {
      baseValue: estimate.baseValue,
      confidence: estimate.confidence,
      sampleSize: estimate.sampleSize,
      sources: estimate.sources,
    },
  });

  await prisma.jerseyMarketValueSnapshot.create({
    data: { jerseyId, value: estimate.baseValue },
  });

  return estimate;
}
