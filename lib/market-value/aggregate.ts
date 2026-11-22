import {
  CONDITION_MULTIPLIER,
  EBAY_MAX_AGE_DAYS,
  EBAY_STALE_DAYS,
  MARKET_METHOD_VERSION,
  MIN_SOURCE_OBSERVATIONS,
  type MethodVersion,
  LONG_SLEEVE_MULTIPLIER,
  PRINTED_MULTIPLIER,
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

const DAY_MS = 86_400_000;
/** Fourchette d'une source calculée à partir de ce nombre de prix ; sinon ± FALLBACK_RANGE autour de la base. */
const RANGE_MIN_OBSERVATIONS = 4;
const FALLBACK_RANGE = 0.25;

/** Quantile à interpolation linéaire (méthode usuelle des tableurs). */
function quantile(values: number[], q: number): number {
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.ceil(pos)] - s[lo]) * (pos - lo);
}

export interface AggregateOptions {
  /** Date de calcul, pour l'âge des données eBay (défaut : maintenant). */
  now?: Date;
  /** Version de méthode : choisit les abattements (défaut : la version courante). */
  methodVersion?: MethodVersion;
}

/**
 * Agrège des signaux de prix en une estimation de valeur pour l'état de référence (GOOD).
 * - Prix demandé (asking) abattu vers un équivalent vente (facteur par source).
 * - Prix normalisé vers l'état de référence (divisé par le multiplicateur d'état du signal).
 * - Chaque source est résumée par la médiane de ses signaux, puis la base est la
 *   moyenne des sources à poids égal : une source n'en écrase pas une autre.
 * Renvoie null si aucun signal.
 *
 * Avant cela (vague 1, 2026-11-21) : données eBay de plus de 60 jours ignorées ;
 * signaux `stale` écartés s'il existe un signal frais ; une source sous
 * MIN_SOURCE_OBSERVATIONS ne vote pas si une autre source l'atteint.
 */
export function aggregate(rawSignals: PriceSignal[], options: AggregateOptions = {}): MarketEstimate | null {
  const now = (options.now ?? new Date()).getTime();
  const ageDays = (s: PriceSignal) => (s.date ? (now - s.date.getTime()) / DAY_MS : 0);
  const fresh = rawSignals.filter((s) => !(s.source === "ebay" && ageDays(s) > EBAY_MAX_AGE_DAYS));
  const onlyStale = fresh.length > 0 && fresh.every((s) => s.stale);
  const usable = onlyStale ? fresh : fresh.filter((s) => !s.stale);

  const obsBySource = new Map<SourceName, number>();
  for (const s of usable) obsBySource.set(s.source, (obsBySource.get(s.source) ?? 0) + (s.observations ?? 1));
  const someSourceIsFed = [...obsBySource.values()].some((n) => n >= MIN_SOURCE_OBSERVATIONS);
  const allSignals = someSourceIsFed
    ? usable.filter((s) => (obsBySource.get(s.source) ?? 0) >= MIN_SOURCE_OBSERVATIONS)
    : usable;

  type SourceAcc = { values: number[]; p25: number[]; p75: number[]; observations: number };
  const bySource = new Map<SourceName, SourceAcc>();
  const signals: PriceSignal[] = [];
  for (const s of allSignals) {
    const abatement = signalAbatement(s.source, s.type, options.methodVersion ?? MARKET_METHOD_VERSION);
    if (abatement === null) continue;
    const factor = abatement / CONDITION_MULTIPLIER[s.condition ?? REFERENCE_CONDITION];
    const acc = bySource.get(s.source) ?? { values: [], p25: [], p75: [], observations: 0 };
    acc.values.push(s.price * factor);
    // Signal déjà agrégé (eBay) : ses quartiles viennent avec lui.
    if (s.p25 != null && s.p75 != null) {
      acc.p25.push(s.p25 * factor);
      acc.p75.push(s.p75 * factor);
    }
    acc.observations += s.observations ?? 1;
    bySource.set(s.source, acc);
    signals.push(s);
  }
  if (signals.length === 0) return null;

  const summaries = [...bySource.entries()].map(([source, acc]) => {
    const med = median(acc.values);
    let low: number | null = null;
    let high: number | null = null;
    if (acc.p25.length > 0) {
      low = median(acc.p25);
      high = median(acc.p75);
    } else if (acc.values.length >= RANGE_MIN_OBSERVATIONS) {
      low = quantile(acc.values, 0.25);
      high = quantile(acc.values, 0.75);
    }
    return { source, median: med, low, high, observations: acc.observations };
  });

  const baseValue = round2(summaries.reduce((sum, x) => sum + x.median, 0) / summaries.length);
  const withRange = summaries.some((x) => x.low !== null);
  // La fourchette couvre au moins chaque source : deux sources en désaccord
  // (eBay 85, CFS 219) donnent une fourchette large, pas une moyenne étroite.
  const medians = summaries.map((x) => x.median);
  const low = withRange
    ? Math.min(baseValue, ...medians, summaries.reduce((sum, x) => sum + (x.low ?? x.median), 0) / summaries.length)
    : Math.min(baseValue * (1 - FALLBACK_RANGE), ...medians);
  const high = withRange
    ? Math.max(baseValue, ...medians, summaries.reduce((sum, x) => sum + (x.high ?? x.median), 0) / summaries.length)
    : Math.max(baseValue * (1 + FALLBACK_RANGE), ...medians);

  const sources = summaries.map((x) => x.source);
  const sourceCounts = Object.fromEntries(summaries.map((x) => [x.source, x.observations]));
  // Total des observations réelles (annonces) derrière les signaux.
  const observations = signals.reduce((sum, s) => sum + (s.observations ?? 1), 0);

  // Barème à points (spec docs/specs/2026-11-22-cote-phase-2.md, décision 1).
  let points = observations >= 20 ? 2 : observations >= 8 ? 1 : 0;
  const dispersion = baseValue > 0 ? (high - low) / baseValue : 0;
  if (withRange && dispersion <= 0.4) points += 1;
  if (dispersion > 0.8) points -= 1;
  if (summaries.length >= 2) {
    const ratio = Math.max(...medians) / Math.max(Math.min(...medians), 0.01);
    if (ratio <= 1.3) points += 1;
    else if (ratio > 1.8) points -= 1;
  }
  if (signals.some((s) => s.source === "ebay" && ageDays(s) > EBAY_STALE_DAYS)) points -= 1;
  let confidence: Confidence = points >= 3 ? "high" : points >= 1 ? "medium" : "low";
  if (onlyStale) confidence = "low";

  return {
    baseValue,
    confidence,
    sampleSize: observations,
    sources,
    low: round2(low),
    high: round2(high),
    sourceCounts,
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
  /** Une dédicace ne compte que prouvée par un certificat. */
  hasAuthCertificate?: boolean;
  /** Floqué (nom ou numéro de joueur). */
  isPrinted?: boolean;
}

/**
 * Une réédition ne prend jamais la cote du maillot : elle est celle de
 * l'original (époque, fabricant d'origine), alors qu'une réédition vaut son prix neuf.
 */
export function usesMarketBase(version?: string | null): boolean {
  // Match worn : pièce unique, sa valeur ne dépend pas du maillot supporter.
  return version !== "REISSUE" && version !== "MATCH_WORN";
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
  if (attr.isPrinted) v *= PRINTED_MULTIPLIER;
  if (attr.isSigned && attr.hasAuthCertificate) v *= SIGNED_MULTIPLIER;
  return round2(v);
}
