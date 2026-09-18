import { browseSearch, type EbayItem } from "./client";
import { aggregateEbay, buildQueries, type EbayAggregate, type JerseyForQuery } from "./matching";

/**
 * Récupère et agrège les annonces eBay d'un maillot sur PLUSIEURS marketplaces.
 * Pour chaque marché : on prend la 1re formulation qui renvoie des annonces (pas
 * de double comptage entre variantes). On poole ensuite toutes les annonces (les
 * marchés sont disjoints) et on calcule UNE médiane sur le pool converti en EUR :
 * plus d'échantillons = cote plus robuste + couverture des clubs "locaux".
 */

/** Marchés interrogés (UK très liquide + gros marchés EUR + clubs locaux). */
export const VALUE_MARKETS = (
  process.env.EBAY_VALUE_MARKETS ?? "EBAY_GB,EBAY_DE,EBAY_IT,EBAY_ES,EBAY_FR"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CALL_DELAY_MS = 120;

export interface CollectResult {
  agg: EbayAggregate | null;
  query: string; // 1re formulation ayant matché (debug)
  marketsUsed: string[]; // marchés ayant renvoyé des annonces
  calls: number; // appels API consommés
}

export async function collectEbayForJersey(
  token: string,
  jersey: JerseyForQuery,
  markets: string[] = VALUE_MARKETS,
  rates?: Record<string, number>
): Promise<CollectResult> {
  const queries = buildQueries(jersey);
  const pool: EbayItem[] = [];
  const marketsUsed: string[] = [];
  let query = "";
  let calls = 0;

  for (const market of markets) {
    for (const q of queries) {
      calls++;
      const items = await browseSearch(token, q, market); // lève EBAY_RATE_LIMIT si quota
      await sleep(CALL_DELAY_MS);
      if (items.length > 0) {
        pool.push(...items);
        marketsUsed.push(market);
        if (!query) query = q;
        break; // marché suivant
      }
    }
  }

  return { agg: aggregateEbay(pool, rates), query, marketsUsed, calls };
}
