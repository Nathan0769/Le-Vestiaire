import prisma from "@/lib/prisma";
import type { Condition, PriceSignal } from "../types";

/**
 * Signaux "vente réelle" issus de nos utilisateurs : les prix d'achat déclarés
 * (hors cadeaux) pour ce maillot. Source propriétaire, grandit avec l'app.
 */
export async function purchasePriceSignals(jerseyId: string): Promise<PriceSignal[]> {
  const items = await prisma.userJersey.findMany({
    where: { jerseyId, isGift: false, purchasePrice: { not: null } },
    select: { purchasePrice: true, condition: true, purchaseDate: true, createdAt: true },
  });

  return items.map((it) => ({
    price: Number(it.purchasePrice),
    type: "sold",
    source: "purchasePrice",
    condition: it.condition as Condition,
    date: it.purchaseDate ?? it.createdAt,
  }));
}
