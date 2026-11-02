import prisma from "@/lib/prisma";
import { getPartnerShop } from "@/lib/partner-shops/shops";
import { isReferenceListing, listingTraits } from "../listing-traits";
import type { PriceSignal } from "../types";

/**
 * Signaux des boutiques partenaires : prix demandé des produits dispo et ventes
 * déduites (taille épuisée ou retirée). Seuls les maillots de référence comptent :
 * un prix de déstockage ne suit pas la version (stock pro vendu au prix supporter).
 */

/** Au-delà, une vente déduite ne dit plus grand-chose du marché actuel. */
export const SOLD_WINDOW_DAYS = 180;

interface PartnerProductRow {
  jerseyId: string;
  shop: string;
  title: string;
  price: number;
  available: boolean;
}

interface PartnerSaleRow {
  jerseyId: string;
  shop: string;
  title: string;
  price: number;
  soldAt: Date;
}

export function toPartnerSignals(input: {
  products: PartnerProductRow[];
  sales: PartnerSaleRow[];
  now: Date;
}): Map<string, PriceSignal[]> {
  const byJersey = new Map<string, PriceSignal[]>();
  const add = (jerseyId: string, signal: PriceSignal) => {
    const list = byJersey.get(jerseyId);
    if (list) list.push(signal);
    else byJersey.set(jerseyId, [signal]);
  };
  const usable = (shopSlug: string, title: string) => {
    const shop = getPartnerShop(shopSlug);
    return shop && isReferenceListing(listingTraits(title)) ? shop : null;
  };

  for (const p of input.products) {
    const shop = p.available ? usable(p.shop, p.title) : null;
    if (!shop || p.price <= 0) continue;
    add(p.jerseyId, {
      price: p.price,
      type: "asking",
      source: `partner:${shop.slug}`,
      condition: shop.itemCondition,
    });
  }

  const since = input.now.getTime() - SOLD_WINDOW_DAYS * 86_400_000;
  for (const s of input.sales) {
    const shop = s.soldAt.getTime() >= since ? usable(s.shop, s.title) : null;
    if (!shop || s.price <= 0) continue;
    add(s.jerseyId, {
      price: s.price,
      type: "sold",
      source: `partner:${shop.slug}`,
      condition: shop.itemCondition,
      date: s.soldAt,
    });
  }

  return byJersey;
}

/** Lit les produits reliés et leurs ventes déduites non annulées (tous les maillots si `jerseyIds` absent). */
export async function loadPartnerSignals(jerseyIds?: string[]): Promise<Map<string, PriceSignal[]>> {
  const now = new Date();
  const jerseyFilter = jerseyIds ? { in: jerseyIds } : { not: null };
  const [products, sales] = await Promise.all([
    prisma.partnerProduct.findMany({
      where: {
        jerseyId: jerseyFilter,
        removedAt: null,
        matchStatus: { in: ["MATCHED", "MANUAL"] },
      },
      select: { jerseyId: true, shop: true, title: true, price: true, available: true },
    }),
    prisma.partnerSale.findMany({
      where: {
        jerseyId: jerseyFilter,
        cancelledAt: null,
        soldAt: { gte: new Date(now.getTime() - SOLD_WINDOW_DAYS * 86_400_000) },
      },
      select: { jerseyId: true, shop: true, price: true, soldAt: true, product: { select: { title: true } } },
    }),
  ]);

  return toPartnerSignals({
    products: products.map((p) => ({ ...p, jerseyId: p.jerseyId!, price: Number(p.price) })),
    sales: sales.map((s) => ({
      jerseyId: s.jerseyId!,
      shop: s.shop,
      title: s.product.title,
      price: Number(s.price),
      soldAt: s.soldAt,
    })),
    now,
  });
}
