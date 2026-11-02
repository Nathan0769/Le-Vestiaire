import type { ShopProduct } from "../types";

/** Robot identifié : la boutique sait qui lit son catalogue (accès accordé par écrit). */
export const PARTNER_USER_AGENT = "LeVestiaireBot (+https://le-vestiaire-foot.fr)";

const PAGE_SIZE = 250;
// Garde-fou contre une pagination qui ne s'arrêterait jamais (10 000 produits).
const MAX_PAGES = 40;

export class PartnerFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number | null
  ) {
    super(message);
    this.name = "PartnerFetchError";
  }
}

export interface ShopifyRawVariant {
  id: number;
  option1: string | null;
  price: string;
  compare_at_price: string | null;
  available: boolean;
}

export interface ShopifyRawProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string | null;
  vendor: string | null;
  images: { src: string }[];
  variants: ShopifyRawVariant[];
}

function toPrice(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function normalizeShopifyProduct(raw: ShopifyRawProduct, baseUrl: string): ShopProduct {
  return {
    externalId: String(raw.id),
    title: raw.title,
    productType: raw.product_type || null,
    vendor: raw.vendor || null,
    url: `${baseUrl}/products/${raw.handle}`,
    imageUrl: raw.images[0]?.src ?? null,
    variants: raw.variants.map((v) => ({
      externalId: String(v.id),
      size: v.option1 && v.option1 !== "Default Title" ? v.option1 : null,
      price: Number(v.price),
      compareAtPrice: toPrice(v.compare_at_price),
      available: v.available,
    })),
  };
}

/** Lit tout le catalogue public d'une boutique Shopify (`/products.json`, paginé). */
export async function fetchShopifyProductsJson(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<ShopProduct[]> {
  const products: ShopProduct[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${baseUrl}/products.json?limit=${PAGE_SIZE}&page=${page}`;
    const res = await fetchImpl(url, {
      headers: { "User-Agent": PARTNER_USER_AGENT, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new PartnerFetchError(`${url} : HTTP ${res.status}`, res.status);
    }

    let body: { products?: ShopifyRawProduct[] };
    try {
      body = JSON.parse(await res.text());
    } catch {
      // Page HTML de vérification anti-bot : on ne la contourne pas, on signale.
      throw new PartnerFetchError(`${url} : réponse non JSON`, res.status);
    }

    const batch = body.products ?? [];
    if (batch.length === 0) return products;
    products.push(...batch.map((p) => normalizeShopifyProduct(p, baseUrl)));
  }

  return products;
}
