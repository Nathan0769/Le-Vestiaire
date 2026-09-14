import {
  ASKING_ABATEMENT,
  CONDITION_MULTIPLIER,
  REFERENCE_CONDITION,
  SOURCE_WEIGHT,
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

function confidenceFrom(sampleSize: number, distinctSources: number): Confidence {
  if (sampleSize >= 5 && distinctSources >= 2) return "high";
  if (sampleSize >= 3) return "medium";
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

  return {
    baseValue,
    confidence: confidenceFrom(signals.length, sources.length),
    sampleSize: signals.length,
    sources,
  };
}

/** Valeur d'un item dans un état donné, à partir de la valeur de base (état de référence). */
export function valueForCondition(baseValue: number, condition: Condition): number {
  return round2(baseValue * CONDITION_MULTIPLIER[condition]);
}
