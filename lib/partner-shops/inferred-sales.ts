import type { PartnerSaleKind } from "@prisma/client";

/**
 * Ventes déduites des changements de disponibilité d'un produit entre deux synchros.
 * Shopify n'expose pas de quantités : une taille qui passe en épuisé ou disparaît
 * compte pour 1 vente, approximative. Spec : docs/specs/2026-11-02-boutiques-partenaires.md.
 */

/** Une taille qui revient avant ce délai était une correction de stock, pas une vente. */
export const CANCEL_WINDOW_MS = 48 * 3600 * 1000;

export interface StoredVariant {
  id: string;
  externalId: string;
  available: boolean;
  removedAt: Date | null;
  availabilityChangedAt: Date;
  price: number;
}

export interface FeedVariant {
  externalId: string;
  available: boolean;
  price: number;
}

export interface VariantChange {
  variantId: string;
  available: boolean;
  removedAt: Date | null;
  availabilityChangedAt: Date;
}

export interface TransitionsResult {
  sales: { variantId: string; kind: PartnerSaleKind; price: number }[];
  /** Variantes dont la dernière vente déduite doit être annulée. */
  cancelVariantIds: string[];
  changes: VariantChange[];
}

export function availabilityTransitions(input: {
  stored: StoredVariant[];
  feed: FeedVariant[];
  productStillListed: boolean;
  now: Date;
}): TransitionsResult {
  const result: TransitionsResult = { sales: [], cancelVariantIds: [], changes: [] };
  // Produit retiré en entier : dépublication possible, on ne déduit rien.
  if (!input.productStillListed) return result;

  const feedById = new Map(input.feed.map((v) => [v.externalId, v]));

  for (const variant of input.stored) {
    const inFeed = feedById.get(variant.externalId);
    const wasOnSale = variant.available && variant.removedAt === null;
    const nextAvailable = inFeed?.available ?? false;
    const nextRemovedAt = inFeed ? null : (variant.removedAt ?? input.now);

    if (nextAvailable === variant.available && (nextRemovedAt === null) === (variant.removedAt === null)) {
      continue;
    }

    if (wasOnSale && !nextAvailable) {
      result.sales.push({
        variantId: variant.id,
        kind: inFeed ? "SOLD_OUT" : "REMOVED",
        price: variant.price,
      });
    }

    const withinWindow =
      input.now.getTime() - variant.availabilityChangedAt.getTime() < CANCEL_WINDOW_MS;
    if (!wasOnSale && nextAvailable && withinWindow) {
      result.cancelVariantIds.push(variant.id);
    }

    result.changes.push({
      variantId: variant.id,
      available: nextAvailable,
      removedAt: nextRemovedAt,
      availabilityChangedAt: input.now,
    });
  }

  return result;
}
