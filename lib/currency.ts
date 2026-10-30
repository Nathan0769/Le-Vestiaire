/**
 * Devises des prix d'achat. Fichier sans dépendance, importable depuis les
 * routes API, les composants client et les scripts.
 *
 * Liste = devises publiées par la BCE (source des taux via Frankfurter, cf.
 * `lib/fx.ts`) : une devise sans taux ne pourrait pas entrer dans le
 * leaderboard ni la cote, donc on ne la propose pas à la saisie.
 */

export const SUPPORTED_CURRENCIES = [
  "EUR", "USD", "GBP", "CHF", "BRL", "MXN", "CAD", "AUD", "JPY", "CNY",
  "KRW", "INR", "ZAR", "TRY", "PLN", "SEK", "NOK", "DKK", "CZK", "HUF",
  "RON", "NZD", "SGD", "HKD", "ILS", "IDR", "MYR", "PHP", "THB", "ISK",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "EUR";

export const CURRENCY_ERROR_MESSAGES = {
  PURCHASE_CURRENCY_INVALID: "Devise invalide",
} as const;

export function isSupportedCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

const EURO_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PT", "SK", "SI", "ES",
  // Hors zone euro mais en euro : micro-États, Monténégro, Kosovo, outre-mer français.
  "MC", "SM", "VA", "AD", "ME", "XK", "GP", "MQ", "GF", "RE", "YT", "PM", "BL", "MF",
];

// Pays dont la devise n'a pas de taux BCE (Argentine, Chili, Colombie...) :
// absents, donc repli EUR. L'utilisateur choisit alors sa devise à la main.
const COUNTRY_CURRENCY: Record<string, Currency> = {
  ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, "EUR" as const])),
  US: "USD", EC: "USD", SV: "USD", PA: "USD", PR: "USD",
  GB: "GBP", CH: "CHF", LI: "CHF", BR: "BRL", MX: "MXN", CA: "CAD",
  AU: "AUD", JP: "JPY", CN: "CNY", KR: "KRW", IN: "INR", ZA: "ZAR",
  TR: "TRY", PL: "PLN", SE: "SEK", NO: "NOK", DK: "DKK", GL: "DKK",
  FO: "DKK", CZ: "CZK", HU: "HUF", RO: "RON", NZ: "NZD", SG: "SGD",
  HK: "HKD", IL: "ILS", ID: "IDR", MY: "MYR", PH: "PHP", TH: "THB",
  IS: "ISK",
};

/** Devise d'un pays ISO 3166-1 alpha-2 (ex. en-tête `x-vercel-ip-country`), repli EUR. */
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? DEFAULT_CURRENCY;
}

/** Taux devise -> EUR (EUR = 1). */
export type RatesToEur = Record<string, number>;

/**
 * Montant converti en EUR, ou null si le taux manque : compter 1 BRL pour 1 €
 * fausserait le leaderboard, mieux vaut ignorer le montant.
 */
export function toEur(amount: number, currency: string, rates: RatesToEur): number | null {
  const rate = rates[currency];
  if (!rate || rate <= 0) return null;
  return amount * rate;
}

export function fromEur(amountEur: number, currency: string, rates: RatesToEur): number | null {
  const rate = rates[currency];
  if (!rate || rate <= 0) return null;
  return amountEur / rate;
}
