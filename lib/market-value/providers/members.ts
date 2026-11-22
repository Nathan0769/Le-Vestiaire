import prisma from "@/lib/prisma";
import { toEur, type RatesToEur } from "@/lib/currency";
import { RETAIL_PURCHASE_SOURCES, type PurchaseSource } from "@/lib/collection-item-rules";
import { usesMarketBase, valueForItem } from "../aggregate";
import type { Condition, PriceSignal } from "../types";

/**
 * Source « achats des membres » : prix payés déclarés avec un lieu d'achat
 * (spec docs/specs/2026-11-22-cote-phase-2.md, décision 3). Un achat est une
 * vente réelle ; ramené au maillot de référence (supporter, sans prime) avant
 * d'entrer dans la cote.
 */

/** Achats pris en compte : datés de moins de 2 ans, ou sans date mais ajoutés depuis moins d'un an. */
const MAX_PURCHASE_AGE_DAYS = 730;
const MAX_UNDATED_AGE_DAYS = 365;

/**
 * Nombre de membres différents requis sur un maillot : en dessous, un membre
 * pourrait retrouver le prix payé par un autre à partir de sa cote.
 */
export const MIN_DISTINCT_MEMBERS = 3;

/**
 * Achat au prix public (boutique officielle, magasin de sport) : prix d'un neuf
 * en boutique, pas un prix de marché. Point de départ : une vente d'occasion
 * vaut ≈ 0,42 × le prix public d'après les relevés du 2026-11-21. À recalibrer
 * dès 30 achats datés comparables.
 */
export const RETAIL_PURCHASE_FACTOR = 0.45;

export interface MemberPurchase {
  jerseyId: string;
  userId: string;
  purchasePrice: number | null;
  purchaseCurrency: string;
  purchaseSource: string | null;
  purchaseDate: Date | null;
  createdAt: Date;
  isGift: boolean;
  isFromMysteryBox: boolean;
  condition: Condition | string;
  version: string;
  hasLongSleeves: boolean | null;
  isSigned: boolean;
  hasAuthCertificate: boolean;
  playerName: string | null;
  playerNumber: number | null;
}

const DAY_MS = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

function retained(p: MemberPurchase, now: Date): boolean {
  if (!p.purchasePrice || p.purchasePrice <= 0 || p.isGift || p.isFromMysteryBox || !p.purchaseSource) return false;
  if (!usesMarketBase(p.version)) return false;
  const age = (d: Date) => (now.getTime() - d.getTime()) / DAY_MS;
  return p.purchaseDate ? age(p.purchaseDate) <= MAX_PURCHASE_AGE_DAYS : age(p.createdAt) <= MAX_UNDATED_AGE_DAYS;
}

export function toMemberSignals(purchases: MemberPurchase[], rates: RatesToEur, now: Date): Map<string, PriceSignal[]> {
  const byJersey = new Map<string, MemberPurchase[]>();
  for (const p of purchases) {
    if (!retained(p, now)) continue;
    const list = byJersey.get(p.jerseyId) ?? [];
    list.push(p);
    byJersey.set(p.jerseyId, list);
  }

  const out = new Map<string, PriceSignal[]>();
  for (const [jerseyId, list] of byJersey) {
    if (new Set(list.map((p) => p.userId)).size < MIN_DISTINCT_MEMBERS) continue;
    const signals: PriceSignal[] = [];
    for (const p of list) {
      const eur = toEur(p.purchasePrice!, p.purchaseCurrency, rates);
      if (eur === null) continue;
      const retail = RETAIL_PURCHASE_SOURCES.includes(p.purchaseSource as PurchaseSource);
      // Primes de l'exemplaire retirées (version, manches, flocage, signé certifié) ; l'état reste
      // sur le signal, l'agrégateur le ramène à GOOD comme pour les autres sources.
      const premium = valueForItem(1, {
        condition: "GOOD",
        version: p.version,
        hasLongSleeves: p.hasLongSleeves,
        isSigned: p.isSigned,
        hasAuthCertificate: p.hasAuthCertificate,
        isPrinted: !!p.playerName?.trim() || p.playerNumber !== null,
      });
      signals.push({
        price: round2(((retail ? eur * RETAIL_PURCHASE_FACTOR : eur) / premium)),
        type: "sold",
        source: "members",
        condition: (retail ? "MINT" : p.condition) as Condition,
        date: p.purchaseDate ?? p.createdAt,
      });
    }
    if (signals.length > 0) out.set(jerseyId, signals);
  }
  return out;
}

/** Achats des membres (tous les maillots si `jerseyIds` absent). */
export async function loadMemberSignals(
  rates: RatesToEur,
  jerseyIds?: string[],
  now = new Date()
): Promise<Map<string, PriceSignal[]>> {
  const rows = await prisma.userJersey.findMany({
    where: {
      ...(jerseyIds && { jerseyId: { in: jerseyIds } }),
      purchaseSource: { not: null },
      purchasePrice: { gt: 0 },
      isGift: false,
      isFromMysteryBox: false,
    },
    select: {
      jerseyId: true,
      userId: true,
      purchasePrice: true,
      purchaseCurrency: true,
      purchaseSource: true,
      purchaseDate: true,
      createdAt: true,
      isGift: true,
      isFromMysteryBox: true,
      condition: true,
      version: true,
      hasLongSleeves: true,
      isSigned: true,
      hasAuthCertificate: true,
      playerName: true,
      playerNumber: true,
    },
  });
  return toMemberSignals(
    rows.map((r) => ({ ...r, purchasePrice: r.purchasePrice === null ? null : Number(r.purchasePrice) })),
    rates,
    now
  );
}
