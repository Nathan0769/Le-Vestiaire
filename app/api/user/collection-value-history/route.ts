import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { collectionHistory } from "@/lib/market-value/collection-valuation";
import { loadValuationContext } from "@/lib/market-value/valuation-context";
import { isSupporter } from "@/lib/subscription";
import { DEFAULT_CURRENCY, fromEur } from "@/lib/currency";
import { getRatesToEur } from "@/lib/fx";

export const dynamic = "force-dynamic";

/**
 * Série "valeur de la collection dans le temps" : valeur de ce que
 * l'utilisateur possédait à chaque date, valorisé au prix de la date
 * (`collectionHistory`, même règle que la page Valeur : le dernier point égale
 * son total). Reconstruite à partir des snapshots de cote par maillot, écrits
 * par le cron quotidien. Cotes en EUR, converties dans la devise du user au taux du jour.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true, currency: true },
  });
  if (!isSupporter(dbUser)) {
    return NextResponse.json({ error: "Réservé aux Supporters", code: "SUPPORTER_ONLY" }, { status: 403 });
  }

  const items = await prisma.userJersey.findMany({
    where: { userId: user.id },
    select: {
      jerseyId: true,
      createdAt: true,
      purchaseDate: true,
      purchasePrice: true,
      purchaseCurrency: true,
      condition: true,
      version: true,
      hasLongSleeves: true,
      isSigned: true,
    },
  });

  const rates = await getRatesToEur();
  const currency = dbUser?.currency && rates[dbUser.currency] ? dbUser.currency : DEFAULT_CURRENCY;

  if (items.length === 0) {
    return NextResponse.json({ points: [], currency });
  }

  const jerseyIds = [...new Set(items.map((i) => i.jerseyId))];
  const [ctx, snapshotRows] = await Promise.all([
    loadValuationContext(jerseyIds, rates),
    prisma.jerseyMarketValueSnapshot.findMany({
      where: { jerseyId: { in: jerseyIds } },
      select: { jerseyId: true, value: true, date: true, methodVersion: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const snapshots = new Map<string, { value: number; time: number; methodVersion: number }[]>();
  for (const s of snapshotRows) {
    const arr = snapshots.get(s.jerseyId) ?? [];
    arr.push({ value: s.value, time: s.date.getTime(), methodVersion: s.methodVersion });
    snapshots.set(s.jerseyId, arr);
  }

  const pointsEur = collectionHistory(
    items.map((i) => ({ ...i, since: i.purchaseDate ?? i.createdAt })),
    { snapshots, ctx, today: new Date().toISOString().slice(0, 10) }
  );
  const points = pointsEur.map((p) => ({
    date: p.date,
    value: Math.round((fromEur(p.value, currency, rates) ?? p.value) * 100) / 100,
  }));

  return NextResponse.json({ points, currency });
}
