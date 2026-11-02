import type { Condition } from "@/lib/market-value/types";

/**
 * Boutiques partenaires : voir docs/specs/2026-11-02-boutiques-partenaires.md.
 * Un fetcher renvoie des ShopProduct normalisés, quel que soit le format source.
 */

export interface ShopVariant {
  externalId: string;
  size: string | null;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
}

export interface ShopProduct {
  externalId: string;
  title: string;
  productType: string | null;
  vendor: string | null;
  url: string;
  imageUrl: string | null;
  variants: ShopVariant[];
}

export type FetcherConfig = { kind: "shopify-products-json"; baseUrl: string };

export interface PartnerShop {
  slug: string;
  name: string;
  /** Domaine de la boutique : seules ses URLs (https) sont stockées. */
  domain: string;
  logoUrl: string;
  fetcher: FetcherConfig;
  /** État des articles pour la cote : neuf = MINT, occasion = GOOD. */
  itemCondition: Extract<Condition, "MINT" | "GOOD">;
  askingWeight: number;
  askingAbatement: number;
  inferredSoldWeight: number;
  promoCode?: string;
  /** Lien sortant vers une fiche produit (tracking, puis affiliation). */
  productLink: (url: string) => string;
  active: boolean;
}
