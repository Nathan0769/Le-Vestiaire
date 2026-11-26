/**
 * Recherche tolérante aux accents et à la ponctuation : "atletico" trouve
 * "Atlético", "saint germain" trouve "Saint-Germain".
 *
 * La même table sert en JS (requête tapée) et en SQL (`translate()` sur les
 * colonnes), pour que les deux côtés soient normalisés à l'identique sans
 * dépendre de l'extension Postgres `unaccent`.
 */
const ACCENT_GROUPS: Record<string, string> = {
  a: "àáâãäåāăąæ",
  c: "çćĉċč",
  d: "ďđ",
  e: "èéêëēĕėęě",
  g: "ĝğġģ",
  h: "ĥħ",
  i: "ìíîïĩīĭįı",
  j: "ĵ",
  k: "ķ",
  l: "ĺļľŀł",
  n: "ñńņňŉ",
  o: "òóôõöøōŏőœ",
  r: "ŕŗř",
  s: "śŝşšșß",
  t: "ţťŧț",
  u: "ùúûüũūŭůűų",
  w: "ŵ",
  y: "ýÿŷ",
  z: "źżž",
};

const ACCENT_MAP = new Map<string, string>();
for (const [plain, accented] of Object.entries(ACCENT_GROUPS)) {
  for (const ch of accented) ACCENT_MAP.set(ch, plain);
}

/** Arguments de `translate(lower(col), FROM, TO)` côté Postgres (1 caractère pour 1). */
export const SEARCH_ACCENTS_FROM = [...ACCENT_MAP.keys()].join("");
export const SEARCH_ACCENTS_TO = [...ACCENT_MAP.values()].join("");

/** Regex Postgres des caractères retirés après `translate` (même règle qu'en JS). */
export const SEARCH_STRIP_PATTERN = "[^a-z0-9]+";

export function normalizeSearchText(value: string): string {
  let out = "";
  for (const ch of value.toLowerCase()) out += ACCENT_MAP.get(ch) ?? ch;
  return out.replace(/[^a-z0-9]+/g, "");
}

/** Filtre local d'une liste (ligues, clubs) : vrai si `text` contient `query`, accents ignorés. */
export function matchesSearch(text: string, query: string): boolean {
  const needle = normalizeSearchText(query);
  return !needle || normalizeSearchText(text).includes(needle);
}
