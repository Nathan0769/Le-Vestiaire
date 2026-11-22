import { usesMarketBase, valueForItem } from "./aggregate";
import { chainSnapshots } from "./method-chain";
import type { Condition } from "./types";
import type { RatesToEur } from "@/lib/currency";
import { priceEur, type PricedItem } from "@/lib/purchase-totals";

/**
 * Valeur d'une collection : une seule règle pour la page Valeur, sa courbe et
 * les stats (vague 1, 2026-11-21 ; avant, les trois écrans donnaient trois
 * totaux différents). Montants en EUR ; les routes convertissent.
 */

export interface ValuedItem extends PricedItem {
  jerseyId: string;
  condition: Condition | string;
  version: string;
  hasLongSleeves: boolean | null;
  isSigned: boolean;
  hasAuthCertificate?: boolean;
  playerName?: string | null;
  playerNumber?: number | null;
}

export interface ValuationContext {
  /** Cote de base (état GOOD) par maillot. */
  marketBase: Map<string, number>;
  marketConfidence: Map<string, string>;
  /** Prix d'achat moyen de ce maillot sur le site, en EUR (repli). */
  siteAverageBuy: Map<string, number>;
  rates: RatesToEur;
  /** Fourchette de la base par maillot (facultatif). */
  marketRange?: Map<string, { low: number; high: number }>;
  /** Observations par source, par maillot (facultatif). */
  marketSources?: Map<string, Record<string, number>>;
}

export interface ItemValue {
  value: number | null;
  source: "market" | "purchase" | "unknown";
  confidence: string | null;
  /** uniquePiece : match worn hors cote ; uncertifiedSignature : dédicace sans certificat, sans prime. */
  valueNote?: "uniquePiece" | "uncertifiedSignature";
  /** Fourchette de l'exemplaire (cote seulement). */
  low?: number;
  high?: number;
  /** Observations par source derrière la cote. */
  sources?: Record<string, number>;
}

const isPrinted = (item: ValuedItem) => !!item.playerName?.trim() || (item.playerNumber ?? null) !== null;

const round2 = (n: number) => Math.round(n * 100) / 100;

function ownBuyEur(item: ValuedItem, rates: RatesToEur): number | null {
  const eur = priceEur(item, rates);
  return eur !== null && eur > 0 ? eur : null;
}

function valueFromBase(item: ValuedItem, base: number): number {
  return valueForItem(base, {
    condition: item.condition as Condition,
    version: item.version,
    hasLongSleeves: item.hasLongSleeves,
    isSigned: item.isSigned,
    hasAuthCertificate: item.hasAuthCertificate,
    isPrinted: isPrinted(item),
  });
}

/** Valeur sans cote : son prix d'achat, sinon la moyenne des achats de ce maillot sur le site. */
function fallbackValue(item: ValuedItem, ctx: ValuationContext): ItemValue {
  const own = ownBuyEur(item, ctx.rates);
  if (!usesMarketBase(item.version)) {
    // Réédition : la moyenne du site mélangerait les achats de l'original.
    return own != null ? { value: round2(own), source: "purchase", confidence: null } : { value: null, source: "unknown", confidence: null };
  }
  const fallback = own ?? ctx.siteAverageBuy.get(item.jerseyId) ?? null;
  return fallback && fallback > 0
    ? { value: round2(fallback), source: "purchase", confidence: null }
    : { value: null, source: "unknown", confidence: null };
}

/**
 * Valeur d'un exemplaire. Une réédition ne prend que son prix d'achat (la cote
 * est celle de l'original) ; sinon la cote si elle existe ; sinon le repli.
 */
export function valueItem(item: ValuedItem, ctx: ValuationContext): ItemValue {
  if (item.version === "MATCH_WORN") return { ...fallbackValue(item, ctx), valueNote: "uniquePiece" };
  if (!usesMarketBase(item.version)) return fallbackValue(item, ctx);
  const note = item.isSigned && !item.hasAuthCertificate ? ("uncertifiedSignature" as const) : undefined;
  const base = ctx.marketBase.get(item.jerseyId);
  if (base != null && base > 0) {
    const value = valueFromBase(item, base);
    const range = ctx.marketRange?.get(item.jerseyId);
    const sources = ctx.marketSources?.get(item.jerseyId);
    const factor = value / base;
    return {
      value,
      source: "market",
      confidence: ctx.marketConfidence.get(item.jerseyId) ?? "low",
      ...(note && { valueNote: note }),
      ...(range && { low: round2(range.low * factor), high: round2(range.high * factor) }),
      ...(sources && { sources }),
    };
  }
  return { ...fallbackValue(item, ctx), ...(note && { valueNote: note }) };
}

export interface HistorySnapshot {
  value: number;
  time: number;
  methodVersion: number;
}

/**
 * Courbe de la valeur de la collection : à chaque date, ce que l'utilisateur
 * possédait, valorisé au prix de la date.
 * - Un maillot entre à sa date d'achat (sinon d'ajout), `since`.
 * - Avant sa première cote, il compte à son prix de repli, pas à 0.
 * - Les snapshots d'une ancienne méthode sont raccordés (chainSnapshots).
 * - Le point du jour utilise la cote actuelle : il égale le total de la page.
 */
export function collectionHistory(
  items: (ValuedItem & { since: Date })[],
  input: { snapshots: Map<string, HistorySnapshot[]>; ctx: ValuationContext; today: string }
): { date: string; value: number }[] {
  if (items.length === 0) return [];
  const chained = new Map<string, HistorySnapshot[]>();
  for (const [jerseyId, snaps] of input.snapshots) chained.set(jerseyId, chainSnapshots(snaps));

  const dayOf = (t: number) => new Date(t).toISOString().slice(0, 10);
  const firstDay = items.map((i) => dayOf(i.since.getTime())).sort()[0];
  const days = new Set<string>([input.today]);
  for (const i of items) days.add(dayOf(i.since.getTime()));
  for (const snaps of chained.values()) for (const s of snaps) days.add(dayOf(s.time));
  const sortedDays = [...days].filter((d) => d >= firstDay && d <= input.today).sort();

  const noMarket: ValuationContext = { ...input.ctx, marketBase: new Map() };
  const baseAt = (jerseyId: string, cutoff: number): number | null => {
    let base: number | null = null;
    for (const s of chained.get(jerseyId) ?? []) {
      if (s.time <= cutoff) base = s.value;
      else break;
    }
    return base;
  };

  return sortedDays.map((day) => {
    const cutoff = new Date(`${day}T23:59:59.999Z`).getTime();
    let total = 0;
    for (const item of items) {
      if (item.since.getTime() > cutoff) continue;
      let v: number | null;
      if (day === input.today) {
        v = valueItem(item, input.ctx).value;
      } else {
        const base = usesMarketBase(item.version) ? baseAt(item.jerseyId, cutoff) : null;
        v = base != null && base > 0 ? valueFromBase(item, base) : valueItem(item, noMarket).value;
      }
      total += v ?? 0;
    }
    return { date: day, value: round2(total) };
  });
}
