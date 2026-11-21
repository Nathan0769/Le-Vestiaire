import { CONDITION_MULTIPLIER } from "./config";
import { hasTerm, listingTraits, normalizeTitle } from "./listing-traits";
import { rejectReason, type JerseyForQuery } from "./ebay/matching";

/**
 * Tri des ventes conclues copiées depuis eBay Product Research (ex-Terapeak)
 * pour le jeu de référence de la cote (docs/market/2026-11-21-terapeak/).
 * Même tri que la collecte eBay de la cote (rejectReason, listingTraits) : on
 * mesure la cote avec les règles qu'elle applique.
 */

export interface SoldListing {
  title: string;
  /** Prix moyen de la ligne, dans la devise affichée par Product Research. */
  price: number;
  format: string;
  /** Nombre de ventes de la ligne (une ligne peut regrouper plusieurs ventes). */
  qty: number;
}

/**
 * Lit le texte collé : chaque vente est un bloc « titre / Edit / prix / format /
 * port / libellé port / quantité / total / enchères / date ».
 */
export function parseProductResearch(raw: string): SoldListing[] {
  const parts = raw.split(/\nEdit\n/);
  const out: SoldListing[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    const before = parts[i].trim().split("\n").filter(Boolean);
    const title = (before[before.length - 1] ?? "").replace(/, preview full size image$/, "").trim();
    const after = parts[i + 1].split("\n").map((x) => x.trim()).filter(Boolean);
    const price = parseFloat((after[0] ?? "").replace(/[£€$,]/g, ""));
    const qty = parseInt(after[4] ?? "", 10);
    if (title && Number.isFinite(price) && price > 0) {
      out.push({ title, price, format: after[1] ?? "", qty: Number.isFinite(qty) && qty > 0 ? qty : 1 });
    }
  }
  return out;
}

export type SaleClass = { kept: false; reason: string } | { kept: true; flocked: boolean; isNew: boolean };

const NEW_TERMS = ["bnwt", "bnib", "nwt", "new with tags", "brand new", "new"];

export function classifySale(title: string, jersey: JerseyForQuery): SaleClass {
  const reason = rejectReason({ title }, jersey);
  if (reason) return { kept: false, reason };
  const traits = listingTraits(title, jersey.season);
  if (traits.version !== "REPLICA") return { kept: false, reason: "version" };
  if (traits.women) return { kept: false, reason: "women" };
  if (traits.bundle) return { kept: false, reason: "bundle" };
  if (traits.longSleeve) return { kept: false, reason: "longSleeve" };
  const padded = ` ${normalizeTitle(title)} `;
  return { kept: true, flocked: traits.printed, isNew: hasTerm(padded, NEW_TERMS) && !hasTerm(padded, ["like new"]) };
}

const median = (a: number[]) => {
  if (a.length === 0) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface SoldSummary {
  /** Ventes du maillot nu, équivalent état GOOD (neuf ÷ coefficient MINT), en devise d'origine. */
  goodEquivalent: number | null;
  /** Ventes nues sans correction d'état. */
  raw: number | null;
  count: number;
  worn: number[];
  new: number[];
  flocked: number[];
}

export function summarizeSales(listings: SoldListing[], jersey: JerseyForQuery): SoldSummary {
  const worn: number[] = [];
  const fresh: number[] = [];
  const flocked: number[] = [];
  for (const l of listings) {
    const c = classifySale(l.title, jersey);
    if (!c.kept) continue;
    const bucket = c.flocked ? flocked : c.isNew ? fresh : worn;
    for (let k = 0; k < l.qty; k++) bucket.push(l.price);
  }
  const nu = [...worn, ...fresh];
  return {
    goodEquivalent: median([...worn, ...fresh.map((p) => p / CONDITION_MULTIPLIER.MINT)]),
    raw: median(nu),
    count: nu.length,
    worn,
    new: fresh,
    flocked,
  };
}
