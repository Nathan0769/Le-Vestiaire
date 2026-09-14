import prisma from "@/lib/prisma";
import type { PriceSignal } from "../types";

/**
 * Signal "prix demandé" de Classic Football Shirts (déjà intégré). Abattu vers un
 * équivalent vente par l'agrégateur. Une seule dispo par maillot.
 */
export async function cfsSignals(jerseyId: string): Promise<PriceSignal[]> {
  const cfs = await prisma.cfsAvailability.findUnique({
    where: { jerseyId },
    select: { price: true, lastSeenAt: true },
  });
  if (!cfs) return [];

  return [
    {
      price: Number(cfs.price),
      type: "asking",
      source: "cfs",
      date: cfs.lastSeenAt,
    },
  ];
}
