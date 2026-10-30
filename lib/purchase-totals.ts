import type { Prisma } from "@prisma/client";
import { toEur, type RatesToEur } from "@/lib/currency";

/**
 * Prix d'achat multi-devises. `purchasePrice` est stocké dans la devise saisie
 * (`purchaseCurrency`) : un `aggregate _sum` SQL additionnerait des R$ et des €.
 * Toute somme ou comparaison entre maillots passe donc par ici, en EUR.
 */

export type PricedItem = {
  purchasePrice: Prisma.Decimal | number | null;
  purchaseCurrency: string;
};

/** Prix en EUR, ou null si absent ou sans taux connu. */
export function priceEur(item: PricedItem, rates: RatesToEur): number | null {
  if (item.purchasePrice === null) return null;
  return toEur(Number(item.purchasePrice), item.purchaseCurrency, rates);
}

export function sumPurchasesEur(items: PricedItem[], rates: RatesToEur): number {
  let total = 0;
  for (const item of items) {
    total += priceEur(item, rates) ?? 0;
  }
  return total;
}
