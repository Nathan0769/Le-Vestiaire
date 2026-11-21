import prisma from "@/lib/prisma";
import { toEur, type RatesToEur } from "@/lib/currency";
import type { ValuationContext } from "./collection-valuation";

/**
 * Cotes et prix d'achat moyens des maillots donnés, pour `valueItem` et
 * `collectionHistory`. Moyenne groupée par devise : une moyenne SQL
 * mélangerait R$ et €. Les rééditions sont exclues de la moyenne (elles ne
 * valent pas l'original).
 */
export async function loadValuationContext(jerseyIds: string[], rates: RatesToEur): Promise<ValuationContext> {
  const [marketRows, avgRows] = await Promise.all([
    prisma.jerseyMarketValue.findMany({
      where: { jerseyId: { in: jerseyIds } },
      select: { jerseyId: true, baseValue: true, confidence: true },
    }),
    prisma.userJersey.groupBy({
      by: ["jerseyId", "purchaseCurrency"],
      where: {
        jerseyId: { in: jerseyIds },
        isGift: false,
        purchasePrice: { gt: 0 },
        version: { not: "REISSUE" },
      },
      _sum: { purchasePrice: true },
      _count: { _all: true },
    }),
  ]);

  const totals = new Map<string, { sumEur: number; count: number }>();
  for (const r of avgRows) {
    const sumEur = toEur(Number(r._sum.purchasePrice ?? 0), r.purchaseCurrency, rates);
    if (sumEur === null) continue;
    const t = totals.get(r.jerseyId) ?? { sumEur: 0, count: 0 };
    t.sumEur += sumEur;
    t.count += r._count._all;
    totals.set(r.jerseyId, t);
  }

  return {
    marketBase: new Map(marketRows.map((m) => [m.jerseyId, m.baseValue])),
    marketConfidence: new Map(marketRows.map((m) => [m.jerseyId, m.confidence])),
    siteAverageBuy: new Map([...totals].map(([id, t]) => [id, t.count > 0 ? t.sumEur / t.count : 0])),
    rates,
  };
}
