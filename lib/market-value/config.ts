import type { Condition, SourceName } from "./types";

/**
 * Paramètres calibrables du modèle. Valeurs de départ : à affiner avec de vraies
 * données (notamment quand eBay sera branché).
 */

/** Poids de fiabilité par source (vente réelle > prix demandé). */
export const SOURCE_WEIGHT: Record<SourceName, number> = {
  ebay: 1.0, // transaction réelle (ventes complétées)
  cfs: 0.5, // prix demandé
};

/**
 * Facteur d'abattement asking→sold par source : un prix demandé est ramené à un
 * équivalent "prix de vente" (asking * facteur). 1.0 pour les sources déjà "sold".
 */
export const ASKING_ABATEMENT: Record<SourceName, number> = {
  // eBay = annonces actives (Browse API) = prix demandé, pas du sold : on abat.
  // Best Offer/négociation courants sur eBay -> abattement plus fort que le retail CFS.
  ebay: 0.85,
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

/**
 * Multiplicateurs de version. Référence = REPLICA (l'écrasante majorité des
 * annonces eBay, donc la base ≈ replica). L'authentic/joueur se paie plus cher.
 * Valeurs de départ, à calibrer avec les données.
 */
export const VERSION_MULTIPLIER: Record<string, number> = {
  REPLICA: 1.0,
  AUTHENTIC: 1.5,
  STOCK_PRO: 1.7,
  PLAYER_ISSUE: 2.2,
  MATCH_WORN: 4.0, // très rare et spéculatif (les match worn sont exclus de la base)
};

/** Premium manches longues (souvent plus rares). */
export const LONG_SLEEVE_MULTIPLIER = 1.1;

/** Premium maillot signé (dédicace authentique). */
export const SIGNED_MULTIPLIER = 1.4;
