/**
 * Modèle de valeur marché (cote estimée) — voir docs/specs/2026-09-11-market-value.md.
 * Un "signal" = un prix observé pour un maillot, issu d'une source.
 */

export type SignalType = "sold" | "asking";

export type SourceName = "purchasePrice" | "ebay" | "cfs";

export type Condition = "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export interface PriceSignal {
  price: number;
  type: SignalType;
  source: SourceName;
  /** État du maillot vendu/proposé, si connu (permet de normaliser vers l'état de référence). */
  condition?: Condition;
  /** Date de la vente/annonce, si connue (pour pondérer par récence plus tard). */
  date?: Date;
}

export type Confidence = "high" | "medium" | "low";

export interface MarketEstimate {
  /** Valeur pour l'état de référence (GOOD). Appliquer un multiplicateur pour un item donné. */
  baseValue: number;
  confidence: Confidence;
  /** Nombre de signaux retenus. */
  sampleSize: number;
  /** Sources distinctes ayant contribué. */
  sources: SourceName[];
}
