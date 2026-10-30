import { redis } from "@/lib/redis";
import { SUPPORTED_CURRENCIES, type RatesToEur } from "@/lib/currency";

/**
 * Taux de change vers EUR : prix d'achat saisis en devise locale et annonces
 * eBay multi-marchés. Source : Frankfurter (données BCE, gratuit, sans clé).
 * Cache Redis 24h. Repli sur des taux statiques si l'API ou Redis échoue :
 * un classement ou une cote ne doit jamais être bloqué par un souci de taux.
 *
 * Cache mémoire par instance devant Redis : le leaderboard, les stats et chaque
 * ajout en collection lisent les taux, inutile de refaire un aller-retour Redis.
 */

const CACHE_KEY = "fx:to-eur:v2";
const CACHE_TTL = 60 * 60 * 24; // 24h
const SYMBOLS = SUPPORTED_CURRENCIES.filter((c) => c !== "EUR");
const MEMO_TTL_MS = 60 * 60 * 1000; // 1h
// Repli gardé moins longtemps : on retente l'API plus tôt.
const FALLBACK_MEMO_TTL_MS = 5 * 60 * 1000;

let memo: { rates: RatesToEur; expiresAt: number } | null = null;

function remember(rates: RatesToEur, ttlMs: number): RatesToEur {
  memo = { rates, expiresAt: Date.now() + ttlMs };
  return rates;
}

/** Ordres de grandeur (devise -> EUR), seulement pour le repli. */
export const FX_FALLBACK_RATES: RatesToEur = {
  EUR: 1,
  USD: 0.86, GBP: 1.15, CHF: 1.07, BRL: 0.16, MXN: 0.047, CAD: 0.62,
  AUD: 0.56, JPY: 0.0058, CNY: 0.12, KRW: 0.00062, INR: 0.0098, ZAR: 0.049,
  TRY: 0.021, PLN: 0.235, SEK: 0.091, NOK: 0.085, DKK: 0.134, CZK: 0.041,
  HUF: 0.0026, RON: 0.197, NZD: 0.5, SGD: 0.66, HKD: 0.11, ILS: 0.26,
  IDR: 0.000052, MYR: 0.2, PHP: 0.015, THB: 0.026, ISK: 0.007,
};

/** Renvoie un map devise -> taux de conversion vers EUR (EUR = 1). */
export async function getRatesToEur(): Promise<RatesToEur> {
  if (memo && memo.expiresAt > Date.now()) return memo.rates;

  try {
    const cached = await redis.get<RatesToEur>(CACHE_KEY);
    if (cached) return remember(cached, MEMO_TTL_MS);
  } catch {
    // Redis indispo : on tente l'API puis le repli.
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=EUR&to=${SYMBOLS.join(",")}`
    );
    if (!res.ok) throw new Error(`FX ${res.status}`);
    const json = (await res.json()) as { rates?: Record<string, number> };
    const eurTo = json.rates;
    if (!eurTo) throw new Error("FX: rates manquants");

    // L'API donne EUR->X ; on veut X->EUR = 1/(EUR->X).
    const toEur: RatesToEur = { EUR: 1 };
    for (const sym of SYMBOLS) {
      const r = eurTo[sym];
      if (r && r > 0) toEur[sym] = 1 / r;
    }
    // Complète avec le repli pour toute devise manquante.
    const merged = { ...FX_FALLBACK_RATES, ...toEur };

    try {
      await redis.set(CACHE_KEY, merged, { ex: CACHE_TTL });
    } catch {
      // Cache best-effort.
    }
    return remember(merged, MEMO_TTL_MS);
  } catch {
    return remember(FX_FALLBACK_RATES, FALLBACK_MEMO_TTL_MS);
  }
}
