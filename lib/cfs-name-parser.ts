import type { JerseyType } from "@prisma/client";

const SEASON_REGEX = /\b(\d{4})(?:-(\d{2}))?\b/g;

export function parseCfsSeason(name: string): string | null {
  for (const match of name.matchAll(SEASON_REGEX)) {
    const year = parseInt(match[1], 10);
    if (year < 1900 || year > 2100) continue;
    return match[2] ? `${match[1]}-${match[2]}` : match[1];
  }
  return null;
}

// The club sits between an optional leading season and the first "descriptor"
// (type, qualifier, product word, brand, or an ordinal like "125th"). CFS names are
// "{season} {Club} {descriptor}…", so this is more reliable than the item's group_ids
// (which often omit the club entirely or bury it under marketing/brand groups), and it
// preserves original casing ("AC Milan", not the "Ac Milan" a slug would produce).
// Plain numbers are NOT descriptors, so club names like "Schalke 04" survive.
const CLUB_DESCRIPTOR =
  /\b(?:\d+(?:st|nd|rd|th)|Authentic|Fan|Player\s+Issue|Pre-?Match|Training|Home|Away|Third|Fourth|Goalkeeper|GK|Shirt|Kit|Shorts|Jacket|Jersey|Long[\s-]Sleeve|L\/S|In\s+Box|Retro|Vintage|Special|Anniversary|Centenary|Puma|Nike|Adidas|Umbro|Kappa|Castore|Hummel|Macron|Joma|Errea|Lotto|New\s+Balance|Le\s+Coq\s+Sportif|Diadora|Kelme|Mizuno)\b/i;

export function parseCfsClub(name: string): string | null {
  const withoutYear = name.replace(/^\d{4}(?:-\d{2})?\s+/, "");
  const cutAt = withoutYear.search(CLUB_DESCRIPTOR);
  const club = (cutAt > 0 ? withoutYear.slice(0, cutAt) : "")
    .replace(/\s+/g, " ")
    .trim();
  return club || null;
}

interface TypePattern {
  type: JerseyType;
  patterns: RegExp[];
}

const TYPE_PATTERNS: TypePattern[] = [
  { type: "HALLOWEEN", patterns: [/\bhalloween\b/i] },
  { type: "OKTOBERFEST", patterns: [/\boktoberfest\b/i] },
  {
    type: "CENTENAIRE",
    patterns: [
      /\bcentenaire\b/i,
      /\bcentenary\b/i,
      /\b100(?:th)?\s+anniversary\b/i,
      /\b100\s+years?\b/i,
    ],
  },
  { type: "HUMANRACE", patterns: [/\bhuman\s*race\b/i] },
  { type: "ONE_PLANET", patterns: [/\bone\s*planet\b/i] },
  {
    type: "OCTOBRE_ROSE",
    patterns: [/\boctobre\s+rose\b/i, /\bpink\b/i, /\bbreast\s+cancer\b/i],
  },
  {
    type: "ANTI_RACISME",
    patterns: [/\banti[\s-]?racism(?:e)?\b/i, /\bno\s+to\s+racism\b/i],
  },
  { type: "HOMMAGE", patterns: [/\bhommage\b/i, /\btribute\b/i, /\bmemorial\b/i] },
  {
    type: "NOUVEL_AN_CHINOIS",
    patterns: [
      /\bchinese\s+new\s+year\b/i,
      /\bcny\b/i,
      /\bnouvel\s+an\s+chinois\b/i,
    ],
  },
  { type: "OFF_WHITE", patterns: [/\boff[\s-]white\b/i] },
  { type: "KOCHE", patterns: [/\bkoche\b/i] },
  { type: "CHAMPION", patterns: [/\bchampions?\s+edition\b/i, /\bwinners?\b/i] },
  { type: "ANNIVERSARY", patterns: [/\banniversary\b/i] },
  { type: "GOALKEEPER", patterns: [/\bgoalkeeper\b/i, /\sgk\s/i, /\sgk$/i] },
  { type: "FOURTH", patterns: [/\bfourth\b/i] },
  { type: "THIRD", patterns: [/\bthird\b/i] },
  { type: "AWAY", patterns: [/\baway\b/i] },
  { type: "HOME", patterns: [/\bhome\b/i] },
];

export function parseCfsType(name: string): JerseyType | null {
  const padded = ` ${name} `;
  for (const { type, patterns } of TYPE_PATTERNS) {
    if (patterns.some((p) => p.test(padded))) return type;
  }
  return null;
}
