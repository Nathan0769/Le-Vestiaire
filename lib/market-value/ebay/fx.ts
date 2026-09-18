import { redis } from "@/lib/redis";
import { FALLBACK_RATES } from "./matching";

/**
 * Taux de change vers EUR pour convertir les prix eBay multi-marchés.
 * Source : Frankfurter (données BCE, gratuit, sans clé). Cache Redis 24h.
 * Repli sur les taux statiques (FALLBACK_RATES) si l'API ou Redis échoue :
 * une cote indicative ne doit jamais être bloquée par un souci de taux.
 */

const CACHE_KEY = "ebay:fx:to-eur";
const CACHE_TTL = 60 * 60 * 24; // 24h
const SYMBOLS = ["GBP", "USD"]; // devises non-EUR des marchés interrogés

/** Renvoie un map devise -> taux de conversion vers EUR (EUR = 1). */
export async function getRatesToEur(): Promise<Record<string, number>> {
  try {
    const cached = await redis.get<Record<string, number>>(CACHE_KEY);
    if (cached) return cached;
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
    const toEur: Record<string, number> = { EUR: 1 };
    for (const sym of SYMBOLS) {
      const r = eurTo[sym];
      if (r && r > 0) toEur[sym] = 1 / r;
    }
    // Complète avec le repli pour toute devise manquante.
    const merged = { ...FALLBACK_RATES, ...toEur };

    try {
      await redis.set(CACHE_KEY, merged, { ex: CACHE_TTL });
    } catch {
      // Cache best-effort.
    }
    return merged;
  } catch {
    return FALLBACK_RATES;
  }
}
