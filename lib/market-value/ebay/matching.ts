import type { EbayItem } from "./client";

/**
 * Construction des requêtes eBay + nettoyage/agrégation des annonces.
 * Objectif : relier une annonce au maillot exact (club/saison/type) malgré le
 * bruit (versions floquées, match worn, tailles enfant) et des libellés variés.
 */

/**
 * Taux de repli vers EUR si les taux live (voir fx.ts) sont indisponibles.
 * Approximatifs, jamais bloquants pour une cote indicative.
 */
export const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  GBP: 1.17,
  USD: 0.92,
};

/**
 * Noms FR -> EN pour la recherche eBay (indexé en anglais). Couvre les nations
 * (nos sélections portent le nom du pays) et les rares clubs à nom francisé.
 * Liste non exhaustive, enrichie au fil des trous constatés.
 */
const NAME_FR_TO_EN: Record<string, string> = {
  // Nations
  Allemagne: "Germany",
  Angleterre: "England",
  Argentine: "Argentina",
  Autriche: "Austria",
  Belgique: "Belgium",
  Brésil: "Brazil",
  Croatie: "Croatia",
  Danemark: "Denmark",
  Écosse: "Scotland",
  Espagne: "Spain",
  "États-Unis": "USA",
  France: "France",
  Grèce: "Greece",
  Hongrie: "Hungary",
  Irlande: "Ireland",
  Italie: "Italy",
  Japon: "Japan",
  Maroc: "Morocco",
  Mexique: "Mexico",
  Norvège: "Norway",
  "Pays-Bas": "Netherlands",
  "Pays de Galles": "Wales",
  Pologne: "Poland",
  Portugal: "Portugal",
  Roumanie: "Romania",
  Russie: "Russia",
  Sénégal: "Senegal",
  Serbie: "Serbia",
  Suède: "Sweden",
  Suisse: "Switzerland",
  Tchéquie: "Czech Republic",
  Turquie: "Turkey",
  Ukraine: "Ukraine",
  Uruguay: "Uruguay",
  Colombie: "Colombia",
  Nigéria: "Nigeria",
  Cameroun: "Cameroon",
  "Côte d'Ivoire": "Ivory Coast",
  "Corée du Sud": "South Korea",
  Angola: "Angola",
  "Bosnie-Herzégovine": "Bosnia",
  Finlande: "Finland",
  Pérou: "Peru",
  Islande: "Iceland",
  Slovaquie: "Slovakia",
  Slovénie: "Slovenia",
  Équateur: "Ecuador",
  Algérie: "Algeria",
  Tunisie: "Tunisia",
  Égypte: "Egypt",
  Australie: "Australia",
  "Arabie Saoudite": "Saudi Arabia",
  // Clubs à nom francisé, non ambigus uniquement (une mauvaise traduction produit
  // des prix FAUX, pire que pas de cote — donc pas de Milan/Munich/Turin ambigus).
  Barcelone: "Barcelona",
  Séville: "Sevilla",
  "Hambourg SV": "Hamburger SV",
  "Red Bull Salzbourg": "Red Bull Salzburg",
};

const TYPE_KEYWORD: Record<string, string> = {
  HOME: "home",
  AWAY: "away",
  THIRD: "third",
  GOALKEEPER: "goalkeeper",
  // FOURTH / SPECIAL : pas de mot-clé fiable, on cherche sans (couverture faible assumée).
  FOURTH: "",
  SPECIAL: "",
};

/** Termes qui trahissent une pièce hors-comparable (à exclure des prix). */
const NOISE_TERMS = [
  "match worn",
  "matchworn",
  "player issue",
  "player-issue",
  "match issue",
  "match prepared",
  "signed",
  "signé",
  "kids",
  "kid ",
  "junior",
  "youth",
  "infant",
  "baby",
  "boys",
  "girls",
  // Flocage / personnalisation : gonfle le prix, on veut la base "blank".
  "nameset",
  "name set",
  "printed",
  "printing",
  "flocage",
  "floqué",
];

/** Numéro de flocage type "#10" (best-effort ; on ne détecte pas les noms seuls). */
const SHIRT_NUMBER_RE = /#\s?\d{1,2}\b/;

export interface JerseyForQuery {
  season: string;
  type: string;
  club: { name: string; country?: string | null };
}

/** Retire les suffixes verbeux d'un nom de club pour la recherche. */
function stripSuffixes(name: string): string {
  return name
    .replace(/\bFootball Club\b/gi, "")
    .replace(/\bFC\b/gi, "")
    .replace(/\bWanderers\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nom du club/nation optimisé pour la recherche eBay (anglais, suffixes retirés).
 * On tente la traduction sur le nom brut PUIS sur le nom nettoyé, pour couvrir
 * les cas comme "FC Barcelone" -> (nettoyé) "Barcelone" -> "Barcelona".
 */
export function searchName(club: { name: string; country?: string | null }): string {
  const cleaned = stripSuffixes(club.name);
  const translated = NAME_FR_TO_EN[club.name] ?? NAME_FR_TO_EN[cleaned];
  return translated ?? cleaned;
}

/** "2024-25" -> "2024/25". */
export function seasonSlash(season: string): string {
  return season.replace("-", "/");
}
/** "2024-25" -> "24/25" ; "2020" reste "2020". */
export function seasonShort(season: string): string {
  const m = season.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return season;
  const end = m[2].length === 4 ? m[2].slice(2) : m[2];
  return `${m[1].slice(2)}/${end}`;
}

/**
 * Formulations de requête à essayer dans l'ordre ; on garde la 1re qui renvoie
 * assez d'annonces. Plusieurs formats de saison car les vendeurs sont incohérents.
 */
export function buildQueries(j: JerseyForQuery): string[] {
  const club = searchName(j.club);
  const type = TYPE_KEYWORD[j.type] ?? "";
  const suffix = type ? `${type} shirt` : "shirt";
  const variants = [
    `${club} ${seasonSlash(j.season)} ${suffix}`,
    `${club} ${seasonShort(j.season)} ${suffix}`,
    `${club} ${suffix} ${seasonSlash(j.season)}`,
  ];
  // Dédoublonne (seasonShort == season quand pas de tiret).
  return [...new Set(variants.map((s) => s.replace(/\s+/g, " ").trim()))];
}

/** Prix en EUR d'un article, ou null si devise inconnue / prix invalide. */
export function itemPriceEur(
  item: EbayItem,
  rates: Record<string, number> = FALLBACK_RATES
): number | null {
  const v = Number(item.price?.value);
  const cur = item.price?.currency;
  if (!cur || !Number.isFinite(v) || v <= 0) return null;
  const rate = rates[cur];
  if (!rate) return null;
  return v * rate;
}

/** Retire les annonces hors-comparable (match worn, floqué, tailles enfant). */
export function filterItems(items: EbayItem[]): EbayItem[] {
  return items.filter((i) => {
    const t = i.title.toLowerCase();
    if (SHIRT_NUMBER_RE.test(t)) return false;
    return !NOISE_TERMS.some((term) => t.includes(term));
  });
}

function median(sorted: number[]): number {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

export interface EbayAggregate {
  medianPrice: number; // EUR
  sampleSize: number;
  currency: string; // devise source dominante (avant conversion)
}

/**
 * Filtre le bruit, convertit en EUR, rogne les extrêmes (déciles) au-delà de
 * 8 annonces, et renvoie la médiane. Null si trop peu de comparables.
 */
export function aggregateEbay(
  items: EbayItem[],
  rates: Record<string, number> = FALLBACK_RATES
): EbayAggregate | null {
  const kept = filterItems(items);
  const priced = kept
    .map((i) => ({ eur: itemPriceEur(i, rates), cur: i.price?.currency }))
    .filter((p): p is { eur: number; cur: string } => p.eur !== null && !!p.cur);

  if (priced.length < 2) return null;

  let values = priced.map((p) => p.eur).sort((a, b) => a - b);
  if (values.length >= 8) {
    const lo = Math.floor(values.length * 0.1);
    const hi = Math.ceil(values.length * 0.9);
    values = values.slice(lo, hi);
  }

  // Devise source dominante (transparence sur l'origine des prix).
  const counts = new Map<string, number>();
  for (const p of priced) counts.set(p.cur, (counts.get(p.cur) ?? 0) + 1);
  const currency = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  return {
    medianPrice: Math.round(median(values) * 100) / 100,
    sampleSize: priced.length,
    currency,
  };
}
