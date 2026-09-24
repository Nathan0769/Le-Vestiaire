import prisma from "@/lib/prisma";
import { aggregate } from "./aggregate";
import { cfsSignals } from "./providers/cfs";
import { ebaySignals } from "./providers/ebay";
import type { MarketEstimate, PriceSignal } from "./types";

/** Rassemble les signaux de toutes les sources pour un maillot. */
export async function collectSignals(jerseyId: string): Promise<PriceSignal[]> {
  const [cfs, ebay] = await Promise.all([
    cfsSignals(jerseyId),
    ebaySignals(jerseyId),
  ]);
  return [...cfs, ...ebay];
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

/**
 * Recalcule la cote de TOUS les maillots ayant un signal, en batch (lectures
 * groupées + écritures groupées) — pour le cron, sans timeout serverless.
 * Stratégie "full refresh" : on remplace toute la table + un snapshot par cote.
 * Sources : CFS (asking, tout le catalogue) + eBay (asking agrégé, maillots
 * possédés — alimenté par le cron refreshEbayMarketData).
 */
export async function recomputeAllMarketValues(): Promise<{
  computed: number;
  cleared: number;
}> {
  const [cfs, ebay] = await Promise.all([
    prisma.cfsAvailability.findMany({
      where: { price: { gt: 0 } },
      select: { jerseyId: true, price: true, lastSeenAt: true },
    }),
    prisma.ebayMarketData.findMany({
      where: { sampleSize: { gt: 0 }, medianPrice: { gt: 0 } },
      select: { jerseyId: true, medianPrice: true, sampleSize: true, lastSeenAt: true },
    }),
  ]);

  const signalsByJersey = new Map<string, PriceSignal[]>();
  const add = (id: string, signal: PriceSignal) => {
    const arr = signalsByJersey.get(id);
    if (arr) arr.push(signal);
    else signalsByJersey.set(id, [signal]);
  };
  for (const c of cfs) {
    add(c.jerseyId, {
      price: Number(c.price),
      type: "asking",
      source: "cfs",
      date: c.lastSeenAt,
    });
  }
  for (const e of ebay) {
    add(e.jerseyId, {
      price: e.medianPrice,
      type: "asking",
      source: "ebay",
      date: e.lastSeenAt,
      observations: e.sampleSize,
    });
  }

  const values: {
    jerseyId: string;
    baseValue: number;
    confidence: string;
    sampleSize: number;
    sources: PriceSignal["source"][];
  }[] = [];
  const snapshots: { jerseyId: string; value: number }[] = [];
  for (const [jerseyId, signals] of signalsByJersey) {
    const estimate = aggregate(signals);
    if (!estimate) continue;
    values.push({
      jerseyId,
      baseValue: estimate.baseValue,
      confidence: estimate.confidence,
      sampleSize: estimate.sampleSize,
      sources: estimate.sources,
    });
    snapshots.push({ jerseyId, value: estimate.baseValue });
  }

  const [cleared] = await prisma.$transaction([
    prisma.jerseyMarketValue.deleteMany({}),
    prisma.jerseyMarketValue.createMany({ data: values }),
  ]);
  if (snapshots.length > 0) {
    await prisma.jerseyMarketValueSnapshot.createMany({ data: snapshots });
  }

  return { computed: values.length, cleared: cleared.count };
}
