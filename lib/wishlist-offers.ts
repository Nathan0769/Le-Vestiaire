export type WishlistOfferStatus = "promo" | "available" | "unavailable";

/**
 * Offres d'achat d'une envie : CFS et boutiques partenaires, du moins cher au
 * plus cher. Seule source pour la carte wishlist, la page partagée et les
 * alertes promo (miroir iOS : `WishlistOffers.swift`).
 *
 * Avec une taille voulue, une offre partenaire qui ne l'a pas est écartée :
 * la famille ne doit pas tomber sur une boutique où la taille est épuisée.
 * CFS ne publie pas ses tailles dans `cfsAvailability`, son offre reste.
 */

export interface WishlistCfsInput {
  price: number | string;
  promoPrice: number | string | null;
  affiliateUrl: string;
}

export interface WishlistPartnerInput {
  shop: string;
  shopName: string;
  price: number;
  compareAtPrice: number | null;
  sizes?: string[];
  url: string;
}

export interface WishlistOffer {
  shop: string;
  shopName: string;
  price: number;
  /** Prix de référence barré, null hors promo. */
  compareAtPrice: number | null;
  /** Remise en pourcentage arrondi, 0 hors promo. */
  discount: number;
  url: string;
}

const discountOf = (price: number, reference: number | null) =>
  reference !== null && reference > price ? Math.round(((reference - price) / reference) * 100) : 0;

export function wishlistOffers(input: {
  cfs: WishlistCfsInput | null;
  partnerOffers: WishlistPartnerInput[];
  size: string | null;
}): WishlistOffer[] {
  const offers: WishlistOffer[] = [];

  if (input.cfs) {
    const price = Number(input.cfs.price);
    const promo = input.cfs.promoPrice !== null ? Number(input.cfs.promoPrice) : null;
    const inPromo = promo !== null && promo < price;
    offers.push({
      shop: "cfs",
      shopName: "CFS",
      price: inPromo ? promo : price,
      compareAtPrice: inPromo ? price : null,
      discount: inPromo ? discountOf(promo, price) : 0,
      url: input.cfs.affiliateUrl,
    });
  }

  for (const o of input.partnerOffers) {
    if (input.size && o.sizes && !o.sizes.includes(input.size)) continue;
    const inPromo = o.compareAtPrice !== null && o.compareAtPrice > o.price;
    offers.push({
      shop: o.shop,
      shopName: o.shopName,
      price: o.price,
      compareAtPrice: inPromo ? o.compareAtPrice : null,
      discount: discountOf(o.price, o.compareAtPrice),
      url: o.url,
    });
  }

  return offers.sort((a, b) => a.price - b.price);
}

/**
 * Classement d'un maillot de wishlist selon ses offres. Un prix barré de
 * boutique compte comme une promo, comme un prix promo CFS (choix de Nathan,
 * 2026-11-02). Économie = celle de l'offre en promo la moins chère.
 */
export function wishlistOfferSummary(input: {
  cfs: WishlistCfsInput | null;
  partnerOffers: WishlistPartnerInput[];
  size?: string | null;
}): { status: WishlistOfferStatus; savings: number } {
  const offers = wishlistOffers({ cfs: input.cfs, partnerOffers: input.partnerOffers, size: input.size ?? null });
  if (offers.length === 0) return { status: "unavailable", savings: 0 };

  const best = offers.find((o) => o.compareAtPrice !== null);
  if (!best) return { status: "available", savings: 0 };
  return { status: "promo", savings: Math.round((best.compareAtPrice! - best.price) * 100) / 100 };
}
