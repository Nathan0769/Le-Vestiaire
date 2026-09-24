import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { valueForItem } from "@/lib/market-value/aggregate";
import { isSupporter } from "@/lib/subscription";
import type { Condition } from "@/lib/market-value/types";

export const dynamic = "force-dynamic";

/**
 * Série "valeur de la collection dans le temps" (option 2 : valeur de ce que
 * l'utilisateur POSSÉDAIT à chaque date, valorisé au prix de la date). Reconstruite
 * à partir des snapshots de cote par maillot (`JerseyMarketValueSnapshot`), écrits
 * périodiquement par le cron. L'historique se construit donc au fil des semaines.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });
  if (!isSupporter(dbUser)) {
    return NextResponse.json({ error: "Réservé aux Supporters" }, { status: 403 });
  }

  const items = await prisma.userJersey.findMany({
    where: { userId: user.id },
    select: {
      jerseyId: true,
      createdAt: true,
      condition: true,
      version: true,
      hasLongSleeves: true,
      isSigned: true,
    },
  });

  if (items.length === 0) {
    return NextResponse.json({ points: [] });
  }

  const jerseyIds = [...new Set(items.map((i) => i.jerseyId))];
  const snapshots = await prisma.jerseyMarketValueSnapshot.findMany({
    where: { jerseyId: { in: jerseyIds } },
    select: { jerseyId: true, value: true, date: true },
    orderBy: { date: "asc" },
  });

  if (snapshots.length === 0) {
    return NextResponse.json({ points: [] });
  }

  // Snapshots groupés par maillot, triés par date croissante.
  const byJersey = new Map<string, { value: number; time: number }[]>();
  for (const s of snapshots) {
    const arr = byJersey.get(s.jerseyId) ?? [];
    arr.push({ value: s.value, time: s.date.getTime() });
    byJersey.set(s.jerseyId, arr);
  }

  // Dates distinctes (normalisées au jour) sur lesquelles on évalue la collection.
  const dayKeys = [
    ...new Set(snapshots.map((s) => s.date.toISOString().slice(0, 10))),
  ].sort();

  // Dernière valeur de base connue pour un maillot à une date donnée (<=).
  const baseAt = (jerseyId: string, cutoff: number): number | null => {
    const arr = byJersey.get(jerseyId);
    if (!arr) return null;
    let base: number | null = null;
    for (const snap of arr) {
      if (snap.time <= cutoff) base = snap.value;
      else break;
    }
    return base;
  };

  const points = dayKeys.map((day) => {
    // Fin de journée : un snapshot pris ce jour-là compte pour ce point.
    const cutoff = new Date(`${day}T23:59:59.999Z`).getTime();
    let total = 0;
    for (const it of items) {
      if (it.createdAt.getTime() > cutoff) continue; // pas encore possédé
      const base = baseAt(it.jerseyId, cutoff);
      if (base == null || base <= 0) continue;
      total += valueForItem(base, {
        condition: it.condition as unknown as Condition,
        version: it.version,
        hasLongSleeves: it.hasLongSleeves,
        isSigned: it.isSigned,
      });
    }
    return { date: day, value: Math.round(total * 100) / 100 };
  });

  return NextResponse.json({ points });
}
