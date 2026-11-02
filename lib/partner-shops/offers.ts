import prisma from "@/lib/prisma";
import { getPartnerShop } from "./shops";
import type { PartnerShop } from "./types";

/** Offre affichée en "disponible chez" (fiche maillot, wishlist). */
export interface PartnerOffer {
  shop: string;
  shopName: string;
  logoUrl: string;
  itemCondition: PartnerShop["itemCondition"];
  price: number;
  compareAtPrice: number | null;
  sizes: string[];
  /** Lien sortant (tracking, puis affiliation). */
  url: string;
  promoCode: string | null;
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
const sizeRank = (size: string) => {
  const i = SIZE_ORDER.indexOf(size.toUpperCase());
  return i === -1 ? SIZE_ORDER.length : i;
};

/**
 * Seule lecture des offres partenaires : produits reliés, en ligne et dispo,
 * la moins chère par boutique et par maillot.
 */
export async function getPartnerOffers(jerseyIds: string[]): Promise<Map<string, PartnerOffer[]>> {
  const offers = new Map<string, PartnerOffer[]>();
  if (jerseyIds.length === 0) return offers;

  const products = await prisma.partnerProduct.findMany({
    where: {
      jerseyId: { in: jerseyIds },
      available: true,
      removedAt: null,
      matchStatus: { in: ["MATCHED", "MANUAL"] },
    },
    orderBy: { price: "asc" },
    select: {
      jerseyId: true,
      shop: true,
      url: true,
      price: true,
      compareAtPrice: true,
      variants: { where: { available: true, removedAt: null }, select: { size: true } },
    },
  });

  for (const p of products) {
    const shop = getPartnerShop(p.shop);
    if (!shop?.active || !p.jerseyId) continue;
    const list = offers.get(p.jerseyId) ?? [];
    // Tri par prix croissant : la première offre d'une boutique est la moins chère.
    if (list.some((o) => o.shop === shop.slug)) continue;
    list.push({
      shop: shop.slug,
      shopName: shop.name,
      logoUrl: shop.logoUrl,
      itemCondition: shop.itemCondition,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
      sizes: p.variants
        .map((v) => v.size)
        .filter((s): s is string => s !== null)
        .sort((a, b) => sizeRank(a) - sizeRank(b)),
      url: shop.productLink(p.url),
      promoCode: shop.promoCode ?? null,
    });
    offers.set(p.jerseyId, list);
  }

  return offers;
}
