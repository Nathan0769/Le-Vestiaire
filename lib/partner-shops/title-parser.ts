import type { JerseyType } from "@prisma/client";

/**
 * Titres Le Parc à Maillots : "{Club} {Type} {Saison} ({tailles})", club en
 * français, saison et type parfois inversés ("Ethiopian Coffee 2021 Extérieur").
 */

export interface ParsedPartnerTitle {
  club: string | null;
  season: string | null;
  type: JerseyType | null;
  longSleeve: boolean;
  /** Faux pour tout ce qui ne doit être ni affiché ni compté (non-maillots, junior). */
  isJersey: boolean;
}

const JERSEY_PRODUCT_TYPES = new Set(["Maillot", "Maillot Gardien"]);

/** Type produit Shopify d'un maillot (le reste du catalogue n'est pas stocké). */
export function isJerseyProductType(productType: string | null): boolean {
  return productType !== null && JERSEY_PRODUCT_TYPES.has(productType);
}

// Lookarounds Unicode plutôt que \b, qui ne voit pas "É" comme une lettre.
const word = (source: string) => new RegExp(`(?<![\\p{L}\\d])(?:${source})(?![\\p{L}\\d])`, "iu");

const TYPE_PATTERNS: { type: JerseyType; pattern: RegExp }[] = [
  // Testé en premier : "Domicile GK" est un maillot gardien.
  { type: "GOALKEEPER", pattern: word("GK|Gardien") },
  { type: "HOME", pattern: word("Domicile|Home") },
  { type: "AWAY", pattern: word("Extérieur|Exterieur|Away") },
  { type: "THIRD", pattern: word("Third") },
  { type: "FOURTH", pattern: word("Fourth") },
  { type: "SPECIAL", pattern: word("Fifth|Special") },
];

const SEASON_PATTERN = word("(?:19|20)\\d{2}-\\d{2}|\\d{2}-\\d{2}|(?:19|20)\\d{2}");
const LONG_SLEEVE_PATTERN = word("LS");
// Rangés en "Maillot" dans la boutique mais hors catalogue (foot, adulte, tenue de match).
const EXCLUDED_PATTERN = word("Veste|JUNIOR|Rugby|Training");

function normalizeSeason(raw: string): string {
  // "22-23" -> "2022-23" ; le catalogue n'a pas de maillot avant 1969.
  return /^\d{2}-\d{2}$/.test(raw) ? `20${raw}` : raw;
}

export function parsePartnerTitle(title: string, productType: string | null): ParsedPartnerTitle {
  const cleaned = title
    .replace(/\([^)]*\)|\[[^\]]*\]|\*[^*]*\*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const isJersey = isJerseyProductType(productType) && !EXCLUDED_PATTERN.test(cleaned);

  const seasonMatch = SEASON_PATTERN.exec(cleaned);
  const typeEntry = TYPE_PATTERNS.find(({ pattern }) => pattern.test(cleaned));

  // Le club précède le premier repère (type, saison ou LS), dans n'importe quel ordre.
  const markers = [
    seasonMatch?.index,
    ...TYPE_PATTERNS.map(({ pattern }) => pattern.exec(cleaned)?.index),
    LONG_SLEEVE_PATTERN.exec(cleaned)?.index,
  ].filter((i): i is number => i !== undefined);
  const clubEnd = markers.length > 0 ? Math.min(...markers) : -1;
  const club = clubEnd > 0 ? cleaned.slice(0, clubEnd).trim() : null;

  return {
    club,
    season: seasonMatch ? normalizeSeason(seasonMatch[0]) : null,
    type: typeEntry?.type ?? null,
    longSleeve: LONG_SLEEVE_PATTERN.test(cleaned),
    isJersey,
  };
}
