import { getPartnerShop } from "@/lib/partner-shops/shops";
import type { Condition, SignalType, SourceName } from "./types";

/**
 * Paramètres calibrables du modèle. Valeurs de départ : à affiner avec de vraies
 * données (notamment quand eBay sera branché).
 */

/**
 * Version de la méthode de cote. 1 : collecte d'origine, abattements calés sur
 * eBay. 2 (vague 1, 2026-11-22) : tri strict des annonces, neuf ramené à GOOD,
 * abattements mesurés sur des ventes réelles. La version d'une cote suit celle
 * de sa collecte eBay (`EbayMarketData.methodVersion`) : jamais de mélange.
 * 3 (phase 2, 2026-11-23) : achats des membres comme source, fourchette et
 * confiance à points ; même collecte et mêmes abattements que la version 2.
 */
export const MARKET_METHOD_VERSION = 3;
export type MethodVersion = 1 | 2 | 3;

/**
 * Facteur d'abattement par source et par version : ramène un prix demandé au
 * niveau d'un prix de vente (asking * facteur). Les sources ont des poids égaux
 * dans la cote, donc leurs niveaux doivent être alignés.
 *
 * Version 1 : eBay 0,85 (négociation supposée), CFS 0,73 calé sur eBay
 * (médiane CFS = 1,17 × médiane eBay, 1 034 maillots, 2026-11-04).
 *
 * Version 2 : mesuré sur ventes réelles (jeu de référence Terapeak du
 * 2026-11-21, docs/market/2026-11-21-terapeak/, scripts/market/terapeak-backtest.ts) :
 * vente ÷ prix demandé de la nouvelle collecte, 31 maillots à 5+ ventes propres,
 * eBay 0,50 (moitiés 0,50 / 0,52), CFS 0,47 (moitiés 0,47 / 0,59). Validation
 * croisée : erreur médiane 49 % -> 16 %, biais +49 % -> +3 %.
 */
export const ASKING_ABATEMENT: Record<MethodVersion, Record<"ebay" | "cfs", number>> = {
  1: { ebay: 0.85, cfs: 0.73 },
  2: { ebay: 0.5, cfs: 0.47 },
  3: { ebay: 0.5, cfs: 0.47 },
};

function partnerShopOf(source: SourceName) {
  return source.startsWith("partner:") ? getPartnerShop(source.slice("partner:".length)) : undefined;
}

/** Facteur asking -> sold d'un signal ; null = source inconnue (boutique retirée du registre), signal ignoré. */
export function signalAbatement(
  source: SourceName,
  type: SignalType,
  version: MethodVersion = MARKET_METHOD_VERSION
): number | null {
  // Vente CFS déduite : faite au niveau de prix de CFS, abattue comme un prix
  // demandé CFS (à recalibrer à partir de 50 ventes).
  if (source === "ebay" || source === "cfs") return ASKING_ABATEMENT[version][source];
  // Achats des membres : déjà des ventes ramenées à la référence (providers/members.ts).
  if (source === "members") return 1;
  const shop = partnerShopOf(source);
  if (!shop) return null;
  // Une vente (même déduite) est déjà un prix de transaction.
  return type === "sold" ? 1 : shop.askingAbatement;
}

/**
 * Une source compte dans la moyenne à partir de ce nombre d'observations, si
 * une autre source l'atteint (choix de Nathan, 2026-11-21) : un produit CFS
 * isolé ne fait plus la moitié de la cote face à 40 annonces eBay.
 */
export const MIN_SOURCE_OBSERVATIONS = 2;

/** Âge d'une donnée eBay au-delà duquel la confiance perd un cran, puis où elle est ignorée. */
export const EBAY_STALE_DAYS = 21;
export const EBAY_MAX_AGE_DAYS = 60;

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
  // MATCH_WORN : hors cote (pièce unique), valorisé à son prix d'achat (usesMarketBase).
};

/** Premium manches longues (plus rares) : 1,32 mesuré sur eBay (85 maillots), arrondi à mi-chemin. */
export const LONG_SLEEVE_MULTIPLIER = 1.2;

/** Premium maillot signé, seulement avec certificat d'authenticité (choix de Nathan, 2026-11-22). */
export const SIGNED_MULTIPLIER = 1.4;

/**
 * Premium maillot floqué (nom et/ou numéro) : floqué ÷ nu = 1,38 en médiane sur
 * 21 maillots du jeu de référence Terapeak (2026-11-21), tout flocage confondu.
 */
export const PRINTED_MULTIPLIER = 1.38;
