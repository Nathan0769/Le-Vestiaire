export type WishlistOfferStatus = "promo" | "available" | "unavailable";

/**
 * Classement d'un maillot de wishlist selon ses offres (CFS et boutiques
 * partenaires). Un prix barré de boutique compte comme une promo, comme un prix
 * promo CFS (choix de Nathan, 2026-11-02). Économie = celle de l'offre en promo
 * la moins chère.
 */
export function wishlistOfferSummary(input: {
  cfs: { price: number; promoPrice: number | null } | null;
  partnerOffers: { price: number; compareAtPrice: number | null }[];
}): { status: WishlistOfferStatus; savings: number } {
  const offers = input.partnerOffers.map((o) => ({ price: o.price, reference: o.compareAtPrice }));
  if (input.cfs) {
    const inPromo = input.cfs.promoPrice !== null && input.cfs.promoPrice < input.cfs.price;
    offers.push(
      inPromo
        ? { price: input.cfs.promoPrice!, reference: input.cfs.price }
        : { price: input.cfs.price, reference: null }
    );
  }
  if (offers.length === 0) return { status: "unavailable", savings: 0 };

  const promos = offers
    .filter((o) => o.reference !== null && o.reference > o.price)
    .sort((a, b) => a.price - b.price);
  if (promos.length === 0) return { status: "available", savings: 0 };

  const best = promos[0];
  return { status: "promo", savings: Math.round((best.reference! - best.price) * 100) / 100 };
}
