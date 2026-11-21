import prisma from "@/lib/prisma";
import { aggregate } from "./aggregate";
import { MARKET_METHOD_VERSION, type MethodVersion } from "./config";
import { isEbayComparable } from "./ebay/matching";
import { CFS_PRODUCT_SIGNAL_SELECT, cfsRowToState, cfsSignals } from "./providers/cfs";
import { toCfsSignals } from "@/lib/cfs-products";
import { ebaySignals } from "./providers/ebay";
import { loadPartnerSignals } from "./providers/partners";
import { snapshotsToWrite } from "./snapshots";
import type { MarketEstimate, PriceSignal } from "./types";

/**
 * Version de méthode d'une cote : celle de sa collecte eBay, ou la version
 * courante sans collecte eBay. Une cote ne mélange jamais une collecte v1 et
 * des abattements v2.
 */
export function methodVersionFor(ebayRow: { methodVersion: number } | null | undefined): MethodVersion {
  return (ebayRow ? ebayRow.methodVersion : MARKET_METHOD_VERSION) as MethodVersion;
}

/** Rassemble les signaux de toutes les sources pour un maillot, et la version de méthode à appliquer. */
export async function collectSignals(
  jerseyId: string
): Promise<{ signals: PriceSignal[]; methodVersion: MethodVersion }> {
  const [cfs, ebay, partners] = await Promise.all([
    cfsSignals(jerseyId),
    ebaySignals(jerseyId),
    loadPartnerSignals([jerseyId]),
  ]);
  return {
    signals: [...cfs, ...ebay.signals, ...(partners.get(jerseyId) ?? [])],
    methodVersion: methodVersionFor(ebay.row),
  };
}

/**
 * Calcule et persiste la cote estimée d'un maillot (+ snapshot pour la tendance).
 * Renvoie l'estimation, ou null si aucun signal exploitable.
 */
export async function computeJerseyMarketValue(
  jerseyId: string
): Promise<MarketEstimate | null> {
  const { signals, methodVersion } = await collectSignals(jerseyId);
  const estimate = aggregate(signals, { methodVersion });

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
      methodVersion,
    },
    update: {
      baseValue: estimate.baseValue,
      confidence: estimate.confidence,
      sampleSize: estimate.sampleSize,
      sources: estimate.sources,
      methodVersion,
    },
  });

  const last = await prisma.jerseyMarketValueSnapshot.findFirst({
    where: { jerseyId },
    orderBy: { date: "desc" },
    select: { value: true, methodVersion: true },
  });
  const [snapshot] = snapshotsToWrite(
    [{ jerseyId, baseValue: estimate.baseValue, methodVersion }],
    new Map(last ? [[jerseyId, last]] : [])
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
 * Sources : CFS (produits de référence, ruptures comprises, et ventes déduites) + eBay (asking agrégé, maillots
 * possédés — alimenté par le cron refreshEbayMarketData) + boutiques partenaires
 * (asking et ventes déduites, maillots de référence uniquement).
 */
export async function recomputeAllMarketValues(): Promise<{
  computed: number;
  cleared: number;
}> {
  const [cfs, ebay, partners, lastSnapshots] = await Promise.all([
    prisma.cfsProduct.findMany({
      where: { price: { gt: 0 }, isReference: true },
      select: CFS_PRODUCT_SIGNAL_SELECT,
    }),
    prisma.ebayMarketData.findMany({
      select: {
        jerseyId: true,
        medianPrice: true,
        sampleSize: true,
        lastSeenAt: true,
        methodVersion: true,
        jersey: { select: { type: true, variant: true } },
      },
    }),
    loadPartnerSignals(),
    // DISTINCT ON côté Postgres : `distinct` Prisma chargerait tout l'historique.
    prisma.$queryRaw<{ jerseyId: string; value: number; methodVersion: number }[]>`
      SELECT DISTINCT ON ("jerseyId") "jerseyId", "value", "methodVersion"
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
  const now = new Date();
  for (const c of cfs) {
    for (const signal of toCfsSignals([cfsRowToState(c)], now)) add(c.jerseyId, signal);
  }
  // Maillots sans comparable eBay fiable (spéciaux, éditions, 2e variante) :
  // leurs anciennes lignes sont ignorées puis supprimées.
  const notComparable: string[] = [];
  const ebayVersion = new Map<string, MethodVersion>();
  for (const e of ebay) {
    if (!isEbayComparable(e.jersey)) {
      notComparable.push(e.jerseyId);
      continue;
    }
    ebayVersion.set(e.jerseyId, methodVersionFor(e));
    if (e.sampleSize <= 0 || e.medianPrice <= 0) continue;
    add(e.jerseyId, {
      price: e.medianPrice,
      type: "asking",
      source: "ebay",
      date: e.lastSeenAt,
      observations: e.sampleSize,
    });
  }

  for (const [jerseyId, signals] of partners) {
    for (const signal of signals) add(jerseyId, signal);
  }

  const values: {
    jerseyId: string;
    baseValue: number;
    confidence: string;
    sampleSize: number;
    sources: PriceSignal["source"][];
    methodVersion: MethodVersion;
  }[] = [];
  for (const [jerseyId, signals] of signalsByJersey) {
    const methodVersion = ebayVersion.get(jerseyId) ?? MARKET_METHOD_VERSION;
    const estimate = aggregate(signals, { now, methodVersion });
    if (!estimate) continue;
    values.push({
      jerseyId,
      baseValue: estimate.baseValue,
      confidence: estimate.confidence,
      sampleSize: estimate.sampleSize,
      sources: estimate.sources,
      methodVersion,
    });
  }

  const [cleared] = await prisma.$transaction([
    prisma.jerseyMarketValue.deleteMany({}),
    prisma.jerseyMarketValue.createMany({ data: values }),
  ]);
  const snapshots = snapshotsToWrite(
    values,
    new Map(lastSnapshots.map((s) => [s.jerseyId, { value: s.value, methodVersion: s.methodVersion }]))
  );
  if (snapshots.length > 0) {
    await prisma.jerseyMarketValueSnapshot.createMany({ data: snapshots });
  }
  if (notComparable.length > 0) {
    await prisma.ebayMarketData.deleteMany({ where: { jerseyId: { in: notComparable } } });
  }

  return { computed: values.length, cleared: cleared.count };
}
