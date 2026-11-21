import { CONDITION_MULTIPLIER } from "../config";
import { hasTerm, isReferenceListing, listingTraits, normalizeTitle } from "../listing-traits";
import type { EbayItem } from "./client";
import { CLUB_AFFIXES, CLUB_ALIASES, EBAY_SEARCH_NAME } from "./search-names";

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
export const NAME_FR_TO_EN: Record<string, string> = {
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
  // FOURTH / SPECIAL : pas de mot-clé fiable. Ces maillots ne sont plus scannés (isEbayComparable).
  FOURTH: "",
  SPECIAL: "",
};

/** Mots qui désignent un type de maillot dans un titre (normalisé). */
const TYPE_TERMS: Record<string, string[]> = {
  HOME: ["home", "domicile", "heim", "casa", "local", "thuis"],
  AWAY: ["away", "exterieur", "auswarts", "trasferta", "visitante", "uit"],
  THIRD: ["third", "3rd", "troisieme", "ausweich"],
  GOALKEEPER: ["goalkeeper", "gk", "keeper", "gardien", "torwart", "portiere", "portero"],
};

/** Seuls ces types ont un mot-clé eBay qui les distingue du maillot principal. */
const EBAY_COMPARABLE_TYPES = new Set(["HOME", "AWAY", "THIRD", "GOALKEEPER"]);

/**
 * Un maillot dont eBay sait trouver les comparables : type principal et
 * variante 1. Une 2e variante ou un maillot d'édition (anniversaire, Octobre
 * rose...) recevrait les annonces du maillot principal.
 */
export function isEbayComparable(jersey: { type: string; variant: number }): boolean {
  return EBAY_COMPARABLE_TYPES.has(jersey.type) && jersey.variant === 1;
}

/** Pièces hors comparable (normalisées, en mots entiers). */
const NOISE_TERMS = [
  "match worn",
  "matchworn",
  "player issue",
  "match issue",
  "match prepared",
  "signed",
  "signe",
  "autograph",
  "autographed",
  // Flocage / personnalisation : gonfle le prix, on veut la base "blank".
  "nameset",
  "name set",
  "printed",
  "printing",
  "flocage",
  "floque",
];

/** Autres vêtements remontés par la recherche. "short" seul reste permis ("short sleeve"). */
const GARMENT_TERMS = [
  "shorts",
  "jacket",
  "tracksuit",
  "training",
  "pre match",
  "prematch",
  "warm up",
  "warmup",
  "anthem",
  "polo",
  "hoodie",
  "sweatshirt",
  "sweater",
  "jumper",
  "scarf",
  "socks",
  "t shirt",
  "tee",
];

const KIDS_TERMS = [
  "kids", "kid", "child", "childs", "children", "childrens", "junior", "juniors", "youth",
  "infant", "infants", "baby", "boys", "boy", "girls", "girl", "enfant", "enfants", "garcon",
  "fille", "kinder", "nino", "nina", "bambino", "bambini", "yrs", "years", "ans",
  "sb", "mb", "lb", "xlb", "xsb", "ys", "ym", "yl", "yxl",
];
// Tailles en centimètres (104 à 164) et âges "age 10".
const KIDS_SIZE_RE = /\b(?:104|110|116|122|128|134|140|146|152|158|164)\s?(?:cm)?\b|\bage\s\d{1,2}\b/;

export interface JerseyForQuery {
  season: string;
  type: string;
  club: { name: string; country?: string | null };
}

/** Retire les suffixes verbeux et les formes juridiques d'un nom de club pour la recherche. */
function stripSuffixes(name: string): string {
  const affixes = new RegExp(`\\b(?:${CLUB_AFFIXES.join("|")})\\b`, "g");
  return name
    .replace(/\bFootball Club\b/gi, "")
    .replace(/\bFC\b/gi, "")
    .replace(/\bWanderers\b/gi, "")
    .replace(affixes, "")
    .replace(/\b(18|19|20)\d{2}\b/g, "") // année de fondation : "US Catanzaro 1929"
    .replace(/^\d+\.\s*/, "") // "1. FC Union Berlin"
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nom du club/nation tel qu'un vendeur eBay l'écrit (anglais, nom d'usage,
 * formes juridiques retirées). Ordre : nom d'usage relevé, traduction sur le
 * nom brut puis sur le nom nettoyé ("FC Barcelone" -> "Barcelone" -> "Barcelona").
 */
export function searchName(club: { name: string; country?: string | null }): string {
  const cleaned = stripSuffixes(club.name);
  const name =
    EBAY_SEARCH_NAME[club.name] ??
    NAME_FR_TO_EN[club.name] ??
    NAME_FR_TO_EN[cleaned] ??
    EBAY_SEARCH_NAME[cleaned] ??
    (cleaned || club.name);
  // Les vendeurs écrivent rarement les accents ("Fenerbahce", "Atletico").
  return name.normalize("NFD").replace(/\p{M}/gu, "");
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

/** Graphies d'une saison dans les titres : 2024/25, 24-25, 2024/2025... ; une saison sur une année reste seule. */
export function seasonTokens(season: string): string[] {
  const m = season.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return [season];
  const start = m[1];
  const endFull = String(parseInt(start, 10) + 1);
  const s2 = start.slice(2);
  const e2 = endFull.slice(2);
  const tokens = [];
  for (const [a, b] of [[start, e2], [s2, e2], [start, endFull]]) {
    for (const sepr of ["/", "-", " "]) tokens.push(`${a}${sepr}${b}`);
  }
  return [...new Set(tokens)];
}

/** Saisons écrites dans un titre normalisé ("2023/24", "2023 24", "1999/2000", "23/24"). */
function seasonsInTitle(padded: string): string[] {
  const found: string[] = [];
  for (const m of padded.matchAll(/(?<=\s)((?:19|20)\d{2})(?:\/|\s)((?:19|20)?\d{2})(?=\s)/g)) {
    const start = parseInt(m[1], 10);
    const end = parseInt(m[2].slice(-2), 10);
    if (end === (start + 1) % 100) found.push(`${m[1]}-${String(end).padStart(2, "0")}`);
  }
  for (const m of padded.matchAll(/(?<=\s)(\d{2})\/(\d{2})(?=\s)/g)) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (b === (a + 1) % 100) found.push(`${a >= 50 ? "19" : "20"}${m[1]}-${m[2]}`);
  }
  return found;
}

/** La saison du maillot apparaît, et aucune autre saison. */
function seasonMatches(padded: string, season: string): boolean {
  const wanted = seasonTokens(season).map((t) => ` ${normalizeTitle(t)} `);
  const m = season.match(/^(\d{4})-\d{2,4}$/);
  if (!wanted.some((t) => padded.includes(t))) {
    // "Lens third shirt 2024" pour 2024-25 : année de début seule, sans autre année ni saison.
    if (!m || !padded.includes(` ${m[1]} `)) return false;
    const years = [...padded.matchAll(/(?<=[\s/])((?:19|20)\d{2})(?=[\s/])/g)].map((x) => x[1]);
    return years.every((y) => y === m[1]) && seasonsInTitle(padded).length === 0;
  }
  if (!m) {
    // Saison sur une année : "2024/25" est admis (MLS, sélections), pas une autre année.
    const y = parseInt(season, 10);
    const years = [...padded.matchAll(/(?<=[\s/])((?:19|20)\d{2})(?=[\s/])/g)].map((x) => parseInt(x[1], 10));
    return years.every((v) => v === y || v === y + 1);
  }
  const canonical = `${m[1]}-${String((parseInt(m[1], 10) + 1) % 100).padStart(2, "0")}`;
  return seasonsInTitle(padded).every((s) => s === canonical);
}

const NAME_PARTICLES = /\b(?:de|del|della|di|do|da|la|le|les|of|the)\b/g;

/** Noms acceptés pour le club dans un titre : nom de recherche, nom catalogue nettoyé (avec et sans particules), alias. */
function clubTerms(club: { name: string }): string[] {
  const search = searchName(club);
  const base = [search, stripSuffixes(club.name), club.name, ...(CLUB_ALIASES[search] ?? [])].map(normalizeTitle);
  const withoutParticles = base.map((t) => t.replace(NAME_PARTICLES, " ").replace(/\s+/g, " ").trim());
  return [...new Set([...base, ...withoutParticles].filter(Boolean))];
}

/** Un autre type de maillot que celui cherché est nommé dans le titre. */
function otherTypeNamed(padded: string, type: string): boolean {
  // Un maillot de gardien s'annonce souvent "home goalkeeper shirt" : seul le gardien compte.
  if (type === "GOALKEEPER") return false;
  return Object.entries(TYPE_TERMS).some(([t, words]) => t !== type && hasTerm(padded, words));
}

function isKids(padded: string, season: string): boolean {
  if (hasTerm(padded, KIDS_TERMS) || KIDS_SIZE_RE.test(padded)) return true;
  // "9-10", "11 12" : deux âges consécutifs, sauf s'ils forment la saison du maillot ("12/13").
  const short = seasonShort(season).replace("/", " ");
  for (const m of padded.matchAll(/(?<=\s)(\d{1,2})(\s|\/)(\d{1,2})(?=\s)/g)) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[3], 10);
    // "9/10" avec une barre : note d'état du vendeur, pas un âge.
    if (m[2] === "/" && b === 10) continue;
    if (a >= 1 && a <= 15 && b === a + 1 && `${m[1]} ${m[3]}` !== short) return true;
  }
  return false;
}

/** Raison d'écarter une annonce pour ce maillot, ou null si elle est comparable. */
export function rejectReason(item: EbayItem, jersey: JerseyForQuery): string | null {
  const padded = ` ${normalizeTitle(item.title)} `;
  // Pièces hors comparable d'abord : une taille enfant "12/13" ressemble à une saison.
  if (hasTerm(padded, NOISE_TERMS)) return "noise";
  if (isKids(padded, jersey.season)) return "kids";
  if (hasTerm(padded, GARMENT_TERMS)) return "garment";
  if (!seasonMatches(padded, jersey.season)) return "season";
  if (!hasTerm(padded, clubTerms(jersey.club))) return "club";
  if (otherTypeNamed(padded, jersey.type)) return "type";
  return null;
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

/** Annonces comparables de ce maillot (bonne saison, club, type ; ni pièce spéciale, ni autre vêtement, ni enfant), toutes versions confondues. */
export function filterComparable(items: EbayItem[], jersey: JerseyForQuery): EbayItem[] {
  return items.filter((i) => rejectReason(i, jersey) === null);
}

/**
 * Sous ce seuil d'évaluations, les annonces sont 20 % moins chères que la
 * médiane du maillot (mesure du 2026-11-02, 6 500 annonces) : signe de contrefaçons.
 */
export const MIN_SELLER_FEEDBACK = 50;

/**
 * Annonces de référence de la cote : comparables, maillot supporter manches
 * courtes coupe homme sans flocage, vendeur établi. Les autres versions sont
 * valorisées par valueForItem. Une annonce sans information vendeur est gardée.
 */
export function filterItems(items: EbayItem[], jersey: JerseyForQuery): EbayItem[] {
  return filterComparable(items, jersey).filter(
    (i) =>
      isReferenceListing(listingTraits(i.title, jersey.season)) &&
      (i.seller?.feedbackScore === undefined || i.seller.feedbackScore >= MIN_SELLER_FEEDBACK)
  );
}

/** Neuf avec ou sans étiquettes (conditionId eBay) : ramené à l'état de référence comme CFS et Le Parc. */
const NEW_CONDITION_IDS = new Set(["1000", "1500"]);

function conditionFactor(item: EbayItem): number {
  return item.conditionId && NEW_CONDITION_IDS.has(item.conditionId) ? CONDITION_MULTIPLIER.MINT : 1;
}

function median(sorted: number[]): number {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

export interface EbayAggregate {
  medianPrice: number; // EUR, équivalent état de référence (GOOD)
  sampleSize: number;
  currency: string; // devise source dominante (avant conversion)
}

/**
 * Filtre le bruit, convertit en EUR, ramène le neuf à l'état de référence,
 * rogne les extrêmes (déciles) au-delà de 8 annonces, et renvoie la médiane.
 * Null si trop peu de comparables.
 */
export function aggregateEbay(
  items: EbayItem[],
  jersey: JerseyForQuery,
  rates: Record<string, number> = FALLBACK_RATES
): EbayAggregate | null {
  const kept = filterItems(items, jersey);
  const priced = kept
    .map((i) => {
      const eur = itemPriceEur(i, rates);
      return { eur: eur === null ? null : eur / conditionFactor(i), cur: i.price?.currency };
    })
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
