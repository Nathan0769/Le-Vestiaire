import type { PartnerOffer } from "@/lib/partner-shops/offers";

/** Recherche CFS affiliée, sans le terme recherché (ajouté en `&q=`). */
export const CFS_SEARCH_BASE_URL =
  "https://www.classicfootballshirts.co.uk/catalogsearch/result/?ref=mgi4mta&utm_source=Affiliates&utm_medium=referral&utm_campaign=Tapfiliate";

export const CFS_LOGO_URL = "https://pub-ad003198168b4f5c8a2c78eb57da8afd.r2.dev/logo-app/logo-cfs.png";

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

export type WhereToBuy = { kind: "offers"; links: WhereToBuyLink[] } | { kind: "search"; url: string } | null;

/**
 * Ligne "Où acheter" de la fiche maillot (règle de Nathan) : un lien par boutique
 * qui a le maillot (CFS et partenaires côte à côte). Sans aucune dispo, une
 * recherche CFS sur le nom anglais du club ; sans nom anglais, rien (une
 * recherche sur le nom français ne trouve rien, ex. "Liban").
 */
export function buildWhereToBuy(input: {
  partnerOffers: PartnerOffer[];
  cfs: { price: number; promoPrice: number | null; affiliateUrl: string } | null;
  cfsSearchName: string | null;
}): WhereToBuy {
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
    const inPromo = input.cfs.promoPrice !== null && input.cfs.promoPrice < input.cfs.price;
    links.push({
      shop: "cfs",
      name: "Classic Football Shirts",
      logoUrl: CFS_LOGO_URL,
      price: inPromo ? input.cfs.promoPrice! : input.cfs.price,
      compareAtPrice: inPromo ? input.cfs.price : null,
      sizes: [],
      url: input.cfs.affiliateUrl,
      promoCode: null,
    });
  }

  if (links.length > 0) {
    return { kind: "offers", links: links.sort((a, b) => a.price - b.price) };
  }
  if (input.cfsSearchName) {
    return { kind: "search", url: `${CFS_SEARCH_BASE_URL}&q=${encodeURIComponent(input.cfsSearchName)}` };
  }
  return null;
}
