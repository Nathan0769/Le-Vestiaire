import {
  ASKING_ABATEMENT,
  CONDITION_MULTIPLIER,
  LONG_SLEEVE_MULTIPLIER,
  REFERENCE_CONDITION,
  SIGNED_MULTIPLIER,
  SOURCE_WEIGHT,
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

/** Médiane pondérée : plus petite valeur dont le poids cumulé atteint la moitié du poids total. */
function weightedMedian(items: { value: number; weight: number }[]): number {
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((s, it) => s + it.weight, 0);
  let cum = 0;
  for (const it of sorted) {
    cum += it.weight;
    if (cum >= total / 2) return it.value;
  }
  return sorted[sorted.length - 1].value;
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
 * - Médiane pondérée par la fiabilité de la source.
 * Renvoie null si aucun signal.
 */
export function aggregate(signals: PriceSignal[]): MarketEstimate | null {
  if (signals.length === 0) return null;

  const items = signals.map((s) => {
    const abatement = ASKING_ABATEMENT[s.source];
    const conditionMult = CONDITION_MULTIPLIER[s.condition ?? REFERENCE_CONDITION];
    return {
      value: (s.price * abatement) / conditionMult,
      weight: SOURCE_WEIGHT[s.source],
    };
  });

  const baseValue = round2(weightedMedian(items));

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
