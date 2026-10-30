import { isSupportedCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

/**
 * Montant formaté dans sa devise, séparateurs selon la langue. Même règle que
 * `Money` côté iOS : arrondi au centime d'abord (19,999 -> 20), décimales
 * seulement si le montant n'est pas rond.
 */
export function formatMoney(amount: number, currency: string, locale: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const safeCurrency = isSupportedCurrency(currency) ? currency : DEFAULT_CURRENCY;
  const digits = Number.isInteger(rounded) ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(rounded);
}
