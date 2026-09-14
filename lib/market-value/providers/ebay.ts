import type { PriceSignal } from "../types";

/**
 * Signaux "vente réelle" eBay (ventes complétées) via la Marketplace Insights API.
 * STUB : renvoie [] tant que l'accès à l'API n'est pas approuvé par eBay.
 * À implémenter : requête par maillot (club/saison/type/marque), filtrage du bruit
 * (tailles enfant, contrefaçons, mauvaises saisons), médiane des ventes récentes.
 */
export async function ebaySignals(_jerseyId: string): Promise<PriceSignal[]> {
  return [];
}
