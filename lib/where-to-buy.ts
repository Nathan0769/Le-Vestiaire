import { withCfsSubId } from "@/lib/cfs-affiliate";
import type { PartnerOffer } from "@/lib/partner-shops/offers";

export const CFS_LOGO_URL = "https://pub-ad003198168b4f5c8a2c78eb57da8afd.r2.dev/logo-app/logo-cfs.png";

export type CfsOffer = { price: number; promoPrice: number | null; affiliateUrl: string };

const effectivePrice = (o: CfsOffer) =>
  o.promoPrice !== null && o.promoPrice < o.price ? o.promoPrice : o.price;

/** Offre CFS la moins chère, promo comprise. */
export function cheapestCfsOffer(offers: (CfsOffer | null)[]): CfsOffer | null {
  return offers.reduce<CfsOffer | null>(
    (best, o) => (o && (!best || effectivePrice(o) < effectivePrice(best)) ? o : best),
    null
  );
}

/** Offre CFS la moins chère de chaque club, à partir des offres de ses maillots. */
export function cheapestCfsOfferByClub(rows: (CfsOffer & { clubId: string })[]): Map<string, CfsOffer> {
  const byClub = new Map<string, CfsOffer>();
  for (const { clubId, ...offer } of rows) {
    const best = cheapestCfsOffer([byClub.get(clubId) ?? null, offer]);
    if (best) byClub.set(clubId, best);
  }
  return byClub;
}

export interface WhereToBuyLink {
  shop: string;
  name: string;
  logoUrl: string;
  price: number;
  compareAtPrice: number | null;
  sizes: string[];
  url: string;
  promoCode: string | null;
}

export type WhereToBuy =
  | { kind: "offers"; links: WhereToBuyLink[] }
  | { kind: "club"; url: string; price: number }
  | null;

/**
 * Ligne "Où acheter" de la fiche maillot (règle de Nathan) : un lien par boutique
 * qui a le maillot (CFS et partenaires côte à côte). Sans aucune dispo, le
 * maillot CFS le moins cher du même club : la recherche CFS redirige vers la
 * page du club en perdant `ref`, Tapfiliate ne comptait pas le clic (2026-11-15).
 */
export function buildWhereToBuy(input: {
  partnerOffers: PartnerOffer[];
  cfs: CfsOffer | null;
  cfsClubOffer: CfsOffer | null;
  /** Emplacement des liens CFS (offre du maillot, autre maillot du club), pour Tapfiliate. */
  subIds?: { offer: string; club: string };
}): WhereToBuy {
  const tag = (url: string, subId: string | undefined) => (subId ? withCfsSubId(url, subId) : url);
  const links: WhereToBuyLink[] = input.partnerOffers.map((o) => ({
    shop: o.shop,
    name: o.shopName,
    logoUrl: o.logoUrl,
    price: o.price,
    compareAtPrice: o.compareAtPrice,
    sizes: o.sizes,
    url: o.url,
    promoCode: o.promoCode,
  }));

  if (input.cfs) {
    const price = effectivePrice(input.cfs);
    links.push({
      shop: "cfs",
      name: "Classic Football Shirts",
      logoUrl: CFS_LOGO_URL,
      price,
      compareAtPrice: price < input.cfs.price ? input.cfs.price : null,
      sizes: [],
      url: tag(input.cfs.affiliateUrl, input.subIds?.offer),
      promoCode: null,
    });
  }

  if (links.length > 0) {
    return { kind: "offers", links: links.sort((a, b) => a.price - b.price) };
  }
  if (input.cfsClubOffer) {
    const o = input.cfsClubOffer;
    return { kind: "club", url: tag(o.affiliateUrl, input.subIds?.club), price: effectivePrice(o) };
  }
  return null;
}
