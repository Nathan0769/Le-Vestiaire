import { SOLD_WINDOW_DAYS } from "@/lib/market-value/providers/partners";
import { CANCEL_WINDOW_MS } from "@/lib/partner-shops/inferred-sales";
import type { Condition, PriceSignal } from "@/lib/market-value/types";

/**
 * Produits CFS reliés au catalogue : vente déduite, offre affichée et signaux de
 * cote. Spec : docs/specs/2026-11-03-cfs-produits-stock.md.
 */

export interface SeenCfsProduct {
  name: string;
  price: number;
  promoPrice: number | null;
  inStock: boolean;
  isReference: boolean;
  condition: Condition | null;
  productUrl: string;
  imageUrl: string;
}

export interface CfsProductState extends SeenCfsProduct {
  /** Passage en rupture observé entre deux scrapes ; null si aucun ou annulé. */
  soldAt: Date | null;
  soldPrice: number | null;
}

const displayedPrice = (p: { price: number; promoPrice: number | null }) => p.promoPrice ?? p.price;

/**
 * Les euros de l'API CFS suivent le taux de change chaque jour : sans marge,
 * ~150 000 produits étaient réécrits par nuit et le cron n'allait jamais au bout
 * (2026-11-10). Une vraie baisse CFS dépasse largement 3 %.
 */
export const CFS_FX_PRICE_TOLERANCE = 0.03;

const withinFx = (stored: number | null, seen: number | null) =>
  stored !== null && seen !== null && Math.abs(seen - stored) / stored < CFS_FX_PRICE_TOLERANCE;

const sameState = (a: CfsProductState, b: CfsProductState) =>
  a.name === b.name &&
  a.price === b.price &&
  a.promoPrice === b.promoPrice &&
  a.inStock === b.inStock &&
  a.isReference === b.isReference &&
  a.condition === b.condition &&
  a.productUrl === b.productUrl &&
  a.imageUrl === b.imageUrl &&
  a.soldAt?.getTime() === b.soldAt?.getTime() &&
  a.soldPrice === b.soldPrice;

/**
 * État d'un produit après un scrape. Un produit vu en stock puis en rupture
 * compte pour une vente au prix affiché ; s'il revient sous 48 h, c'était une
 * correction de stock. Un produit déjà en rupture à sa première apparition
 * n'est pas une vente : sa date est inconnue.
 */
export function nextCfsProductState(
  stored: CfsProductState | undefined,
  seen: SeenCfsProduct,
  now: Date
): { state: CfsProductState; changed: boolean; sale: boolean; cancelled: boolean } {
  if (!stored) {
    return { state: { ...seen, soldAt: null, soldPrice: null }, changed: true, sale: false, cancelled: false };
  }

  let { soldAt, soldPrice } = stored;
  const sale = stored.inStock && !seen.inStock;
  const cancelled =
    !stored.inStock && seen.inStock && soldAt !== null && now.getTime() - soldAt.getTime() < CANCEL_WINDOW_MS;
  if (sale) {
    soldAt = now;
    soldPrice = displayedPrice(stored);
  } else if (cancelled) {
    soldAt = null;
    soldPrice = null;
  }

  const state = {
    ...seen,
    price: withinFx(stored.price, seen.price) ? stored.price : seen.price,
    promoPrice: withinFx(stored.promoPrice, seen.promoPrice) ? stored.promoPrice : seen.promoPrice,
    soldAt,
    soldPrice,
  };
  return { state, changed: !sameState(stored, state), sale, cancelled };
}

/**
 * Ordre d'écriture quand un passage ne peut pas tout écrire : stock, ventes et
 * promos d'abord (0), simples changements de prix ensuite (1), rattrapés les
 * nuits suivantes.
 */
export function cfsUpdatePriority(stored: CfsProductState, next: CfsProductState): 0 | 1 {
  const priceOnly = sameState({ ...stored, price: next.price, promoPrice: next.promoPrice }, next) &&
    (stored.promoPrice === null) === (next.promoPrice === null);
  return priceOnly ? 1 : 0;
}

const CONDITION_RANK: Record<Condition, number> = { MINT: 4, EXCELLENT: 3, GOOD: 2, FAIR: 1, POOR: 0 };
const conditionRank = (c: Condition | null) => (c ? CONDITION_RANK[c] : -1);

/**
 * Offre affichée sur la fiche : le produit en stock le moins cher, quelle que
 * soit la version ; à prix égal, le maillot de référence puis le meilleur état.
 */
export function pickDisplayedOffer<T extends SeenCfsProduct>(products: T[]): T | null {
  let best: T | null = null;
  for (const p of products) {
    if (!p.inStock) continue;
    if (
      !best ||
      displayedPrice(p) < displayedPrice(best) ||
      (displayedPrice(p) === displayedPrice(best) &&
        (Number(p.isReference) - Number(best.isReference) ||
          conditionRank(p.condition) - conditionRank(best.condition)) > 0)
    ) {
      best = p;
    }
  }
  return best;
}

/**
 * Signaux de cote des produits CFS d'un maillot : maillots de référence
 * seulement, ruptures comprises (un prix CFS reste un prix CFS). Une vente
 * récente remplace le prix demandé du même produit.
 */
export function toCfsSignals(
  rows: (CfsProductState & { lastSeenAt: Date })[],
  now: Date
): PriceSignal[] {
  const since = now.getTime() - SOLD_WINDOW_DAYS * 86_400_000;
  const signals: PriceSignal[] = [];
  for (const r of rows) {
    if (!r.isReference) continue;
    const condition = r.condition ?? undefined;
    if (r.soldAt && r.soldPrice && r.soldAt.getTime() >= since) {
      signals.push({ price: r.soldPrice, type: "sold", source: "cfs", condition, date: r.soldAt });
    } else if (r.price > 0) {
      signals.push({ price: r.price, type: "asking", source: "cfs", condition, date: r.lastSeenAt });
    }
  }
  return signals;
}
