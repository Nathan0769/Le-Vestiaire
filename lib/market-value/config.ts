import { getPartnerShop } from "@/lib/partner-shops/shops";
import type { Condition, SignalType, SourceName } from "./types";

/**
 * Paramètres calibrables du modèle. Valeurs de départ : à affiner avec de vraies
 * données (notamment quand eBay sera branché).
 */

/**
 * Facteur d'abattement par source : ramène un prix demandé au niveau d'un prix
 * de vente sur le marché de l'occasion (asking * facteur). Les sources ont des
 * poids égaux dans la cote, donc leurs niveaux doivent être alignés : eBay sert
 * d'étalon (marché le plus liquide, vendeurs peu évalués écartés) et les autres
 * sources sont calibrées sur lui. Mesure du 2026-11-02 : prix CFS de référence
 * = 1,29 × médiane eBay pour un même maillot (218 maillots) -> 0,85 / 1,29.
 */
export const ASKING_ABATEMENT: Record<"ebay" | "cfs", number> = {
  // Best Offer / négociation courants sur eBay.
  ebay: 0.85,
  cfs: 0.65,
};

function partnerShopOf(source: SourceName) {
  return source.startsWith("partner:") ? getPartnerShop(source.slice("partner:".length)) : undefined;
}

/** Facteur asking -> sold d'un signal ; null = source inconnue (boutique retirée du registre), signal ignoré. */
export function signalAbatement(source: SourceName, type: SignalType): number | null {
  if (source === "ebay" || source === "cfs") return ASKING_ABATEMENT[source];
  const shop = partnerShopOf(source);
  if (!shop) return null;
  // Une vente (même déduite) est déjà un prix de transaction.
  return type === "sold" ? 1 : shop.askingAbatement;
}

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
 * Multiplicateurs de version. Référence = REPLICA : la base de la cote ne retient
 * que des maillots supporter (listingTraits). Mesurés le 2026-11-02 sur eBay
 * (scripts/market/calibrate-multipliers.ts, 150 maillots : médiane du ratio
 * version / supporter pour un même maillot), puis arrondis à mi-chemin entre
 * l'ancienne valeur et la mesure : authentic 1,45 mesuré, player issue 2,55.
 * Stock pro : terme absent d'eBay, valeur non mesurée.
 */
export const VERSION_MULTIPLIER: Record<string, number> = {
  REPLICA: 1.0,
  AUTHENTIC: 1.5,
  STOCK_PRO: 1.7,
  PLAYER_ISSUE: 2.35,
  MATCH_WORN: 4.0, // très rare et spéculatif (les match worn sont exclus de la base)
};

/** Premium manches longues (plus rares) : 1,32 mesuré sur eBay (85 maillots), arrondi à mi-chemin. */
export const LONG_SLEEVE_MULTIPLIER = 1.2;

/** Premium maillot signé (dédicace authentique). */
export const SIGNED_MULTIPLIER = 1.4;
