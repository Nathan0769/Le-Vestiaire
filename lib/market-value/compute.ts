import prisma from "@/lib/prisma";
import { aggregate } from "./aggregate";
import { cfsSignals } from "./providers/cfs";
import { ebaySignals } from "./providers/ebay";
import { snapshotsToWrite } from "./snapshots";
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

  const last = await prisma.jerseyMarketValueSnapshot.findFirst({
    where: { jerseyId },
    orderBy: { date: "desc" },
    select: { value: true },
  });
  const [snapshot] = snapshotsToWrite(
    [{ jerseyId, baseValue: estimate.baseValue }],
    new Map(last ? [[jerseyId, last.value]] : [])
  );
  if (snapshot) {
    await prisma.jerseyMarketValueSnapshot.create({ data: snapshot });
  }

  return estimate;
}

/**
 * Recalcule la cote de TOUS les maillots ayant un signal, en batch (lectures
 * groupées + écritures groupées) — pour le cron, sans timeout serverless.
 * Stratégie "full refresh" : on remplace toute la table ; snapshot seulement
 * pour les cotes qui ont changé depuis le précédent.
 * Sources : CFS (asking, tout le catalogue) + eBay (asking agrégé, maillots
 * possédés — alimenté par le cron refreshEbayMarketData).
 */
export async function recomputeAllMarketValues(): Promise<{
  computed: number;
  cleared: number;
}> {
  const [cfs, ebay, lastSnapshots] = await Promise.all([
    prisma.cfsAvailability.findMany({
      where: { price: { gt: 0 } },
      select: { jerseyId: true, price: true, lastSeenAt: true },
    }),
    prisma.ebayMarketData.findMany({
      where: { sampleSize: { gt: 0 }, medianPrice: { gt: 0 } },
      select: { jerseyId: true, medianPrice: true, sampleSize: true, lastSeenAt: true },
    }),
    // DISTINCT ON côté Postgres : `distinct` Prisma chargerait tout l'historique.
    prisma.$queryRaw<{ jerseyId: string; value: number }[]>`
      SELECT DISTINCT ON ("jerseyId") "jerseyId", "value"
      FROM "jersey_market_value_snapshots"
      ORDER BY "jerseyId", "date" DESC
    `,
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
  }

  const [cleared] = await prisma.$transaction([
    prisma.jerseyMarketValue.deleteMany({}),
    prisma.jerseyMarketValue.createMany({ data: values }),
  ]);
  const snapshots = snapshotsToWrite(
    values,
    new Map(lastSnapshots.map((s) => [s.jerseyId, s.value]))
  );
  if (snapshots.length > 0) {
    await prisma.jerseyMarketValueSnapshot.createMany({ data: snapshots });
  }

  return { computed: values.length, cleared: cleared.count };
}
