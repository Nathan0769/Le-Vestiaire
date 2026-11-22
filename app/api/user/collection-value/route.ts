import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { valueItem } from "@/lib/market-value/collection-valuation";
import { loadValuationContext } from "@/lib/market-value/valuation-context";
import { isSupporter } from "@/lib/subscription";
import { DEFAULT_CURRENCY, fromEur } from "@/lib/currency";
import { getRatesToEur } from "@/lib/fx";
import { priceEur } from "@/lib/purchase-totals";
import { getTranslations } from "next-intl/server";
import { getRequestLocale } from "@/lib/request-locale";
import { MARKET_RECALC_DATE, recalcNoticeDate } from "@/lib/market-value/recalc-notice";

export const dynamic = "force-dynamic";

/**
 * Données de la page "Valeur de ma collection" : résumé (valeur totale, investi,
 * plus-value, moyenne) + valeur par maillot. Couverture 100% : un maillot sans
 * cote marché est estimé à son prix d'achat (le tien, sinon la moyenne des achats
 * de ce maillot sur le site). Une réédition ne prend que son propre prix d'achat :
 * la cote et la moyenne des achats sont celles de l'original.
 *
 * Calculs en EUR (cote et prix d'achat convertis), montants renvoyés dans la
 * devise du user (`currency`).
 */
/** Phrase de recalcul dans la langue de la requête (web : locale du site, iOS : Accept-Language), ou undefined. */
async function recalcNotice(request: Request): Promise<string | undefined> {
  const date = recalcNoticeDate(MARKET_RECALC_DATE, new Date());
  if (!date) return undefined;
  const locale = getRequestLocale(request);
  const t = await getTranslations({ locale, namespace: "MarketValue" });
  const formatted = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
  return t("recalcNotice", { date: formatted });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Réservé aux Supporters : on ne divulgue aucune valeur aux autres.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true, currency: true },
  });
  if (!isSupporter(dbUser)) {
    return NextResponse.json({ error: "Réservé aux Supporters", code: "SUPPORTER_ONLY" }, { status: 403 });
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
      hasAuthCertificate: true,
      playerName: true,
      playerNumber: true,
      purchasePrice: true,
      purchaseCurrency: true,
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

  const rates = await getRatesToEur();
  const currency = dbUser?.currency && rates[dbUser.currency] ? dbUser.currency : DEFAULT_CURRENCY;

  if (collection.length === 0) {
    return NextResponse.json({
      summary: { estimated: 0, invested: 0, gain: 0, gainPct: 0, avg: 0, count: 0 },
      rows: [],
      currency,
    });
  }

  const jerseyIds = [...new Set(collection.map((i) => i.jerseyId))];
  const ctx = await loadValuationContext(jerseyIds, rates);

  const rows = collection.map((item) => {
    const ownBuyEur = priceEur(item, rates);
    const ownBuy = ownBuyEur !== null && ownBuyEur > 0 ? ownBuyEur : null;
    const { value, source, confidence, valueNote, low, high, sources } = valueItem(item, ctx);

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
      // Fourchette, sources (nombres seulement) et note : facultatifs, ajoutés en phase 2.
      low: low ?? null,
      high: high ?? null,
      sources: sources ?? null,
      valueNote: valueNote ?? null,
      isPrinted: !!item.playerName?.trim() || item.playerNumber !== null,
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
  let estimatedLow = 0;
  let estimatedHigh = 0;
  let valued = 0;
  let invested = 0;
  let pricedCurrentValue = 0;
  let pricedCount = 0;
  for (const r of rows) {
    if (r.value != null) {
      estimated += r.value;
      // Maillot sans fourchette (prix d'achat) : sa valeur compte des deux côtés.
      estimatedLow += r.low ?? r.value;
      estimatedHigh += r.high ?? r.value;
      valued += 1;
    }
    if (!r.isGift && r.ownBuy != null && r.value != null) {
      invested += r.ownBuy;
      pricedCurrentValue += r.value;
      pricedCount += 1;
    }
  }
  const gain = pricedCurrentValue - invested;

  const round = (n: number) => Math.round((fromEur(n, currency, rates) ?? n) * 100) / 100;
  const summary = {
    estimated: round(estimated),
    estimatedLow: round(estimatedLow),
    estimatedHigh: round(estimatedHigh),
    count: valued,
    invested: round(invested),
    currentValuePriced: round(pricedCurrentValue),
    gain: round(gain),
    gainPct: invested > 0 ? Math.round((gain / invested) * 100) : 0,
    pricedCount,
    avg: valued > 0 ? round(estimated / valued) : 0,
  };

  const displayRows = rows.map((r) => ({
    ...r,
    value: r.value != null ? round(r.value) : null,
    low: r.low != null ? round(r.low) : null,
    high: r.high != null ? round(r.high) : null,
    ownBuy: r.ownBuy != null ? round(r.ownBuy) : null,
  }));

  return NextResponse.json({ summary, rows: displayRows, currency, notice: await recalcNotice(request) });
}
