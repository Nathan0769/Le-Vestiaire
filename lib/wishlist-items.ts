import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getPartnerOffers } from "@/lib/partner-shops/offers";

/**
 * Forme d'une envie renvoyée au propriétaire (GET /api/wishlist, PATCH
 * /api/wishlist/[id]), contrat iOS `wishlist`. Ne sélectionne jamais
 * `reservation` (surprise) ni `promoNotifiedPrice` (interne au cron).
 */
const WISHLIST_ITEM_SELECT = {
  id: true,
  jerseyId: true,
  priority: true,
  createdAt: true,
  size: true,
  version: true,
  flockName: true,
  flockNumber: true,
  jersey: {
    include: {
      club: { include: { league: true } },
      cfsAvailability: {
        select: { id: true, price: true, promoPrice: true, affiliateUrl: true },
      },
    },
  },
} satisfies Prisma.WishlistSelect;

export async function findOwnerWishlistItems(where: Prisma.WishlistWhereInput) {
  const items = await prisma.wishlist.findMany({
    where,
    select: WISHLIST_ITEM_SELECT,
    orderBy: { createdAt: "desc" },
  });

  const partnerOffers = await getPartnerOffers(items.map((item) => item.jerseyId));

  return items.map((item) => ({
    ...item,
    jersey: {
      ...item.jersey,
      retailPrice: item.jersey.retailPrice ? Number(item.jersey.retailPrice) : null,
      cfsAvailability: item.jersey.cfsAvailability
        ? {
            ...item.jersey.cfsAvailability,
            price: Number(item.jersey.cfsAvailability.price),
            promoPrice:
              item.jersey.cfsAvailability.promoPrice !== null
                ? Number(item.jersey.cfsAvailability.promoPrice)
                : null,
          }
        : null,
      partnerOffers: partnerOffers.get(item.jerseyId) ?? [],
    },
  }));
}
