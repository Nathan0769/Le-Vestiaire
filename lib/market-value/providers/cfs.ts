import prisma from "@/lib/prisma";
import type { PriceSignal } from "../types";

/**
 * Signal "prix demandé" de Classic Football Shirts (déjà intégré). Abattu vers un
 * équivalent vente par l'agrégateur. Une seule dispo par maillot.
 */
export async function cfsSignals(jerseyId: string): Promise<PriceSignal[]> {
  const cfs = await prisma.cfsAvailability.findUnique({
    where: { jerseyId },
    select: { price: true, lastSeenAt: true, isReference: true, condition: true },
  });
  // Version pro ou manches longues : affichée sur la fiche, mais hors base de la cote.
  if (!cfs || !cfs.isReference || Number(cfs.price) <= 0) return [];

  return [
    {
      price: Number(cfs.price),
      type: "asking",
      source: "cfs",
      condition: cfs.condition ?? undefined,
      date: cfs.lastSeenAt,
    },
  ];
}
