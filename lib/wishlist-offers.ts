import { withCfsSubId } from "@/lib/cfs-affiliate";

export type WishlistOfferStatus = "promo" | "available" | "unavailable";

/**
 * Offres d'achat d'une envie : CFS et boutiques partenaires, du moins cher au
 * plus cher. Seule source pour la carte wishlist, la page partagée et les
 * alertes promo (miroir iOS : `WishlistOffers.swift`).
 *
 * Avec une taille voulue, une offre garde la taille voulue, sinon une taille
 * voisine (M ou XL pour un L : ça taille parfois pareil, choix de Nathan le
 * 2026-11-11), signalée dans `otherSizes`. Une offre sans l'une ni l'autre est
 * écartée : pas de promo affichée sur une taille que la personne ne peut pas porter.
 */

/** Tailles dans l'ordre, pour trouver les voisines d'une taille voulue. */
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export function neighbourSizes(size: string): string[] {
  const i = SIZE_ORDER.indexOf(size);
  return i < 0 ? [] : [SIZE_ORDER[i - 1], SIZE_ORDER[i + 1]].filter((s): s is string => !!s);
}

/** Meilleure offre CFS d'une taille en stock (écrite par le cron `cfs-availability`). */
export interface WishlistCfsSizeOffer {
  size: string;
  price: number;
  promoPrice: number | null;
  affiliateUrl: string;
}

export interface WishlistCfsInput {
  price: number | string;
  promoPrice: number | string | null;
  affiliateUrl: string;
  /** Tailles en stock ; null tant que le cron n'a pas relu le maillot (offre gardée telle quelle). */
  sizes?: WishlistCfsSizeOffer[] | null;
}

/**
 * Ligne `cfsAvailability` (Prisma ou JSON) vers l'entrée des offres. Avec
 * `subId`, chaque lien affilié porte son emplacement, tailles comprises.
 */
export function cfsOfferInput(
  row: {
    price: number | string | { toString(): string };
    promoPrice: number | string | { toString(): string } | null;
    affiliateUrl: string;
    sizeOffers?: unknown;
  },
  subId?: string
): WishlistCfsInput & { price: number; promoPrice: number | null } {
  const tag = (url: string) => (subId ? withCfsSubId(url, subId) : url);
  const sizes = Array.isArray(row.sizeOffers)
    ? (row.sizeOffers as WishlistCfsSizeOffer[]).map((s) => ({ ...s, affiliateUrl: tag(s.affiliateUrl) }))
    : null;
  return {
    price: Number(row.price),
    promoPrice: row.promoPrice === null ? null : Number(row.promoPrice),
    affiliateUrl: tag(row.affiliateUrl),
    sizes,
  };
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
  /** Tailles voisines proposées quand la taille voulue manque ; vide sinon. */
  otherSizes: string[];
}

const discountOf = (price: number, reference: number | null) =>
  reference !== null && reference > price ? Math.round(((reference - price) / reference) * 100) : 0;

export function wishlistOffers(input: {
  cfs: WishlistCfsInput | null;
  partnerOffers: WishlistPartnerInput[];
  size: string | null;
}): WishlistOffer[] {
  const offers: WishlistOffer[] = [];
  const size = input.size;
  const neighbours = size ? neighbourSizes(size) : [];

  const cfs = input.cfs ? pickCfsForSize(input.cfs, size, neighbours) : null;
  if (cfs) {
    const inPromo = cfs.promoPrice !== null && cfs.promoPrice < cfs.price;
    offers.push({
      shop: "cfs",
      shopName: "CFS",
      price: inPromo ? cfs.promoPrice! : cfs.price,
      compareAtPrice: inPromo ? cfs.price : null,
      discount: inPromo ? discountOf(cfs.promoPrice!, cfs.price) : 0,
      url: cfs.affiliateUrl,
      otherSizes: cfs.otherSizes,
    });
  }

  for (const o of input.partnerOffers) {
    let otherSizes: string[] = [];
    if (size && o.sizes && !o.sizes.includes(size)) {
      otherSizes = neighbours.filter((s) => o.sizes!.includes(s));
      if (otherSizes.length === 0) continue;
    }
    const inPromo = o.compareAtPrice !== null && o.compareAtPrice > o.price;
    offers.push({
      shop: o.shop,
      shopName: o.shopName,
      price: o.price,
      compareAtPrice: inPromo ? o.compareAtPrice : null,
      discount: discountOf(o.price, o.compareAtPrice),
      url: o.url,
      otherSizes,
    });
  }

  return offers.sort((a, b) => a.price - b.price);
}

const effectivePrice = (o: { price: number; promoPrice: number | null }) =>
  o.promoPrice !== null && o.promoPrice < o.price ? o.promoPrice : o.price;

/** Offre CFS pour la taille voulue, sinon la voisine la moins chère, sinon rien. */
function pickCfsForSize(
  cfs: WishlistCfsInput,
  size: string | null,
  neighbours: string[]
): { price: number; promoPrice: number | null; affiliateUrl: string; otherSizes: string[] } | null {
  const main = {
    price: Number(cfs.price),
    promoPrice: cfs.promoPrice !== null ? Number(cfs.promoPrice) : null,
    affiliateUrl: cfs.affiliateUrl,
    otherSizes: [] as string[],
  };
  if (!size || !cfs.sizes) return main;

  const exact = cfs.sizes.find((s) => s.size === size);
  if (exact) return { ...exact, otherSizes: [] };
  const near = cfs.sizes.filter((s) => neighbours.includes(s.size));
  if (near.length === 0) return null;
  const best = near.reduce((a, b) => (effectivePrice(b) < effectivePrice(a) ? b : a));
  return { ...best, otherSizes: neighbours.filter((n) => near.some((s) => s.size === n)) };
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
