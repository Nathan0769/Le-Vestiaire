import prisma from "@/lib/prisma";
import { toCfsSignals } from "@/lib/cfs-products";
import type { PriceSignal } from "../types";

export const CFS_PRODUCT_SIGNAL_SELECT = {
  jerseyId: true,
  name: true,
  price: true,
  promoPrice: true,
  inStock: true,
  isReference: true,
  condition: true,
  productUrl: true,
  imageUrl: true,
  soldAt: true,
  soldPrice: true,
  lastSeenAt: true,
} as const;

/** Ligne Prisma -> état numérique attendu par toCfsSignals. */
export function cfsRowToState<T extends { price: unknown; promoPrice: unknown; soldPrice: unknown }>(row: T) {
  return {
    ...row,
    price: Number(row.price),
    promoPrice: row.promoPrice === null ? null : Number(row.promoPrice),
    soldPrice: row.soldPrice === null ? null : Number(row.soldPrice),
  };
}

/**
 * Signaux Classic Football Shirts d'un maillot : prix demandé de chaque produit
 * de référence (ruptures comprises) et ventes déduites récentes. Abattus vers un
 * équivalent vente par l'agrégateur.
 */
export async function cfsSignals(jerseyId: string, now = new Date()): Promise<PriceSignal[]> {
  const rows = await prisma.cfsProduct.findMany({
    where: { jerseyId, isReference: true },
    select: CFS_PRODUCT_SIGNAL_SELECT,
  });
  return toCfsSignals(rows.map(cfsRowToState), now);
}
