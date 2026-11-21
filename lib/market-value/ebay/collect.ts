import { browseSearch, type EbayItem } from "./client";
import { aggregateEbay, buildQueries, filterItems, type EbayAggregate, type JerseyForQuery } from "./matching";

/**
 * Récupère et agrège les annonces eBay d'un maillot sur PLUSIEURS marketplaces.
 * Pour chaque marché : on prend la 1re formulation qui donne au moins
 * MIN_KEPT_PER_QUERY annonces après tri (pas de double comptage entre variantes). On poole ensuite toutes les annonces (les
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
/** En dessous, la formulation suivante peut trouver mieux (ex. "24/25" au lieu de "2024/25"). */
const MIN_KEPT_PER_QUERY = 5;

type Search = (token: string, query: string, marketId: string) => Promise<EbayItem[]>;

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
  rates?: Record<string, number>,
  search: Search = browseSearch
): Promise<CollectResult> {
  const queries = buildQueries(jersey);
  const pool: EbayItem[] = [];
  const marketsUsed: string[] = [];
  let query = "";
  let calls = 0;

  for (const market of markets) {
    let best: { items: EbayItem[]; kept: number; q: string } | null = null;
    for (const q of queries) {
      calls++;
      const items = await search(token, q, market); // lève EBAY_RATE_LIMIT si quota
      if (search === browseSearch) await sleep(CALL_DELAY_MS);
      const kept = filterItems(items, jersey).length;
      if (!best || kept > best.kept) best = { items, kept, q };
      if (kept >= MIN_KEPT_PER_QUERY) break; // marché suivant
    }
    if (best && best.kept > 0) {
      pool.push(...best.items);
      marketsUsed.push(market);
      if (!query) query = best.q;
    }
  }

  return { agg: aggregateEbay(pool, jersey, rates), query, marketsUsed, calls };
}
