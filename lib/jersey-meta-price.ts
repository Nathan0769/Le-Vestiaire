import { formatMoney } from "@/lib/format-money";
import type { WhereToBuy } from "@/lib/where-to-buy";

export interface JerseyMetaPrice {
  /** Prix le plus bas, formaté selon la langue (ex. « 35,99 € »). */
  price: string;
  /** Remise de cette offre en %, null hors promo. */
  discountPercent: number | null;
}

/**
 * Prix affiché dans le <title> et la meta description de la fiche maillot.
 * Seulement quand ce maillot est en vente : le repli « autre maillot du club »
 * ne vend pas celui-ci. Les liens de `buildWhereToBuy` sont déjà triés par prix
 * effectif (promo comprise), en euros.
 */
export function buildJerseyMetaPrice(whereToBuy: WhereToBuy, locale: string): JerseyMetaPrice | null {
  if (whereToBuy?.kind !== "offers" || whereToBuy.links.length === 0) return null;
  const cheapest = whereToBuy.links[0];
  const discount =
    cheapest.compareAtPrice && cheapest.compareAtPrice > cheapest.price
      ? Math.round((1 - cheapest.price / cheapest.compareAtPrice) * 100)
      : 0;
  return {
    price: formatMoney(cheapest.price, "EUR", locale),
    discountPercent: discount >= 1 ? discount : null,
  };
}
