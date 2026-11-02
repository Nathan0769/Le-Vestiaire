import type { PartnerShop } from "./types";

const LOGO_BASE_URL = "https://pub-ad003198168b4f5c8a2c78eb57da8afd.r2.dev/logo-app";

function withTracking(url: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "levestiaire");
  u.searchParams.set("utm_medium", "referral");
  return u.toString();
}

/**
 * Registre des boutiques partenaires : seule source de leurs paramètres
 * (fetcher, poids dans la cote, lien sortant, code promo).
 */
export const PARTNER_SHOPS: PartnerShop[] = [
  {
    slug: "leparcamaillots",
    name: "Le Parc à Maillots",
    domain: "leparcamaillots.com",
    logoUrl: `${LOGO_BASE_URL}/logo-le-parc-a-maillots.png`,
    fetcher: { kind: "shopify-products-json", baseUrl: "https://leparcamaillots.com" },
    // Neuf authentique de déstockage : ramené à l'état de référence GOOD par l'agrégateur.
    itemCondition: "MINT",
    // Mesure du 2026-11-02 : prix neuf = 1,03 × médiane eBay (32 maillots). Une fois
    // ramené à GOOD (÷ 1,25), il tombe au niveau eBay sans abattement.
    askingAbatement: 1.0,
    productLink: withTracking,
    active: true,
  },
];

export function getPartnerShop(slug: string): PartnerShop | undefined {
  return PARTNER_SHOPS.find((shop) => shop.slug === slug);
}

function isHttpsOnHost(url: string, hosts: string[]): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return hosts.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
  );
}

/** Le flux est une donnée externe : on ne stocke que des liens vers la boutique elle-même. */
export function isAllowedShopUrl(shop: PartnerShop, url: string): boolean {
  return isHttpsOnHost(url, [shop.domain]);
}

export function isAllowedImageUrl(shop: PartnerShop, url: string): boolean {
  return isHttpsOnHost(url, [shop.domain, "cdn.shopify.com"]);
}
