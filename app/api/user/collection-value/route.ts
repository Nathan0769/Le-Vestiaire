import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { valueForItem } from "@/lib/market-value/aggregate";
import { isSupporter } from "@/lib/subscription";
import type { Condition } from "@/lib/market-value/types";

export const dynamic = "force-dynamic";

/**
 * Données de la page "Valeur de ma collection" : résumé (valeur totale, investi,
 * plus-value, moyenne) + valeur par maillot. Couverture 100% : un maillot sans
 * cote marché est estimé à son prix d'achat (le tien, sinon la moyenne des achats
 * de ce maillot sur le site).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Réservé aux Supporters : on ne divulgue aucune valeur aux autres.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });
  if (!isSupporter(dbUser)) {
    return NextResponse.json({ error: "Réservé aux Supporters" }, { status: 403 });
  }

  const collection = await prisma.userJersey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      jerseyId: true,
      condition: true,
      version: true,
      hasLongSleeves: true,
      isSigned: true,
      purchasePrice: true,
      isGift: true,
      createdAt: true,
      jersey: {
        select: {
          name: true,
          season: true,
          type: true,
          imageUrl: true,
          club: { select: { name: true } },
        },
      },
    },
  });

  if (collection.length === 0) {
    return NextResponse.json({
      summary: { estimated: 0, invested: 0, gain: 0, gainPct: 0, avg: 0, count: 0 },
      rows: [],
    });
  }

  const jerseyIds = [...new Set(collection.map((i) => i.jerseyId))];

  const [marketRows, avgRows] = await Promise.all([
    prisma.jerseyMarketValue.findMany({
      where: { jerseyId: { in: jerseyIds } },
      select: { jerseyId: true, baseValue: true, confidence: true },
    }),
    // Prix d'achat moyen de ce maillot, tous utilisateurs confondus (repli).
    prisma.userJersey.groupBy({
      by: ["jerseyId"],
      where: { jerseyId: { in: jerseyIds }, isGift: false, purchasePrice: { gt: 0 } },
      _avg: { purchasePrice: true },
    }),
  ]);

  const baseByJersey = new Map(marketRows.map((m) => [m.jerseyId, m.baseValue]));
  const confByJersey = new Map(marketRows.map((m) => [m.jerseyId, m.confidence]));
  const avgBuyByJersey = new Map(
    avgRows.map((r) => [r.jerseyId, r._avg.purchasePrice ? Number(r._avg.purchasePrice) : 0])
  );

  const rows = collection.map((item) => {
    const base = baseByJersey.get(item.jerseyId);
    const ownBuy =
      item.purchasePrice && Number(item.purchasePrice) > 0 ? Number(item.purchasePrice) : null;

    let value: number | null;
    let source: "market" | "purchase" | "unknown";
    let confidence: string | null = null;

    if (base != null && base > 0) {
      value = valueForItem(base, {
        condition: item.condition as unknown as Condition,
        version: item.version,
        hasLongSleeves: item.hasLongSleeves,
        isSigned: item.isSigned,
      });
      source = "market";
      confidence = confByJersey.get(item.jerseyId) ?? "low";
    } else {
      const fallback = ownBuy ?? avgBuyByJersey.get(item.jerseyId) ?? null;
      value = fallback && fallback > 0 ? Math.round(fallback * 100) / 100 : null;
      source = value != null ? "purchase" : "unknown";
    }

    return {
      id: item.id,
      clubName: item.jersey.club.name,
      jerseyName: item.jersey.name,
      season: item.jersey.season,
      type: item.jersey.type,
      version: item.version,
      condition: item.condition,
      imageUrl: item.jersey.imageUrl,
      value,
      source,
      confidence,
      ownBuy,
      isGift: item.isGift,
      addedAt: item.createdAt.toISOString(),
    };
  });

  rows.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  // Résumé.
  // - Valeur totale : tous les maillots valorisés (cote ou prix d'achat).
  // - Performance : périmètre COHÉRENT = maillots dont le prix d'achat est connu
  //   (hors cadeaux). Investi vs valeur actuelle de CES mêmes maillots -> plus-value
  //   qui se réconcilie (investi + plus-value = valeur actuelle du périmètre).
  let estimated = 0;
  let valued = 0;
  let invested = 0;
  let pricedCurrentValue = 0;
  let pricedCount = 0;
  for (const r of rows) {
    if (r.value != null) {
      estimated += r.value;
      valued += 1;
    }
    if (!r.isGift && r.ownBuy != null && r.value != null) {
      invested += r.ownBuy;
      pricedCurrentValue += r.value;
      pricedCount += 1;
    }
  }
  const gain = pricedCurrentValue - invested;

  const round = (n: number) => Math.round(n * 100) / 100;
  const summary = {
    estimated: round(estimated),
    count: valued,
    invested: round(invested),
    currentValuePriced: round(pricedCurrentValue),
    gain: round(gain),
    gainPct: invested > 0 ? Math.round((gain / invested) * 100) : 0,
    pricedCount,
    avg: valued > 0 ? round(estimated / valued) : 0,
  };

  return NextResponse.json({ summary, rows });
}
