import {
  CONDITION_MULTIPLIER,
  LONG_SLEEVE_MULTIPLIER,
  REFERENCE_CONDITION,
  SIGNED_MULTIPLIER,
  signalAbatement,
  VERSION_MULTIPLIER,
} from "./config";
import type {
  Condition,
  Confidence,
  MarketEstimate,
  PriceSignal,
  SourceName,
} from "./types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/**
 * Confiance basée sur le nombre d'OBSERVATIONS réelles (annonces), pas sur le
 * nombre de signaux. Un signal eBag = médiane de N annonces -> N observations.
 * Une 2e source concordante permet le palier "medium" avec moins d'observations.
 */
function confidenceFrom(observations: number, distinctSources: number): Confidence {
  if (observations >= 20) return "high";
  if (observations >= 8 || (observations >= 4 && distinctSources >= 2)) return "medium";
  return "low";
}

/**
 * Agrège des signaux de prix en une estimation de valeur pour l'état de référence (GOOD).
 * - Prix demandé (asking) abattu vers un équivalent vente (facteur par source).
 * - Prix normalisé vers l'état de référence (divisé par le multiplicateur d'état du signal).
 * - Chaque source est résumée par la médiane de ses signaux, puis la base est la
 *   moyenne des sources à poids égal : une source n'en écrase pas une autre.
 * Renvoie null si aucun signal.
 */
export function aggregate(allSignals: PriceSignal[]): MarketEstimate | null {
  const valuesBySource = new Map<SourceName, number[]>();
  const signals: PriceSignal[] = [];
  for (const s of allSignals) {
    const abatement = signalAbatement(s.source, s.type);
    if (abatement === null) continue;
    const conditionMult = CONDITION_MULTIPLIER[s.condition ?? REFERENCE_CONDITION];
    const values = valuesBySource.get(s.source) ?? [];
    values.push((s.price * abatement) / conditionMult);
    valuesBySource.set(s.source, values);
    signals.push(s);
  }
  if (signals.length === 0) return null;

  const sourceValues = [...valuesBySource.values()].map(median);
  const baseValue = round2(sourceValues.reduce((sum, v) => sum + v, 0) / sourceValues.length);

  const sources: SourceName[] = [];
  for (const s of signals) if (!sources.includes(s.source)) sources.push(s.source);

  // Total des observations réelles (annonces) derrière les signaux.
  const observations = signals.reduce((sum, s) => sum + (s.observations ?? 1), 0);

  return {
    baseValue,
    confidence: confidenceFrom(observations, sources.length),
    sampleSize: observations,
    sources,
  };
}

/** Valeur d'un item dans un état donné, à partir de la valeur de base (état de référence). */
export function valueForCondition(baseValue: number, condition: Condition): number {
  return round2(baseValue * CONDITION_MULTIPLIER[condition]);
}

/** Attributs d'un exemplaire possédé qui modulent sa valeur au-delà de l'état. */
export interface ItemValuationAttributes {
  condition: Condition;
  version?: string; // JerseyVersion (REPLICA par défaut)
  hasLongSleeves?: boolean | null;
  isSigned?: boolean;
}

/**
 * Valeur d'un exemplaire précis à partir de la valeur de base (état de référence
 * GOOD, ≈ replica). Compose les multiplicateurs : état × version × manches × signé.
 * La base eBay/CFS étant surtout du replica, un authentic vaut logiquement plus.
 */
export function valueForItem(baseValue: number, attr: ItemValuationAttributes): number {
  let v = baseValue * CONDITION_MULTIPLIER[attr.condition];
  v *= VERSION_MULTIPLIER[attr.version ?? "REPLICA"] ?? 1;
  if (attr.hasLongSleeves) v *= LONG_SLEEVE_MULTIPLIER;
  if (attr.isSigned) v *= SIGNED_MULTIPLIER;
  return round2(v);
}
