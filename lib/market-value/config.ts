import type { Condition, SourceName } from "./types";

/**
 * Paramètres calibrables du modèle. Valeurs de départ : à affiner avec de vraies
 * données (notamment quand eBay sera branché).
 */

/** Poids de fiabilité par source (vente réelle > prix demandé). */
export const SOURCE_WEIGHT: Record<SourceName, number> = {
  purchasePrice: 1.0, // transaction réelle, propriétaire
  ebay: 1.0, // transaction réelle (ventes complétées)
  cfs: 0.5, // prix demandé
};

/**
 * Facteur d'abattement asking→sold par source : un prix demandé est ramené à un
 * équivalent "prix de vente" (asking * facteur). 1.0 pour les sources déjà "sold".
 */
export const ASKING_ABATEMENT: Record<SourceName, number> = {
  purchasePrice: 1.0,
  ebay: 1.0,
  cfs: 0.8,
};

/** État de référence : la valeur de base correspond à un maillot dans cet état. */
export const REFERENCE_CONDITION: Condition = "GOOD";

/** Multiplicateurs d'état (référence GOOD = 1.0). */
export const CONDITION_MULTIPLIER: Record<Condition, number> = {
  MINT: 1.25,
  EXCELLENT: 1.1,
  GOOD: 1.0,
  FAIR: 0.8,
  POOR: 0.6,
};
