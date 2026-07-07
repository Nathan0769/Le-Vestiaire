/**
 * Normalise une saison DB en format d'affichage court "YYYY-YY".
 * "2024-2025" -> "2024-25"
 * "2024-25"   -> "2024-25"
 * "2024"      -> "2024"
 */
export function normalizeSeason(season: string): string {
  const fullRange = season.match(/^(\d{4})-(\d{4})$/);
  if (fullRange) return `${fullRange[1]}-${fullRange[2].slice(2)}`;
  return season;
}

/**
 * Formate un intervalle "start -> end" avec normalisation.
 * Retourne "start" si start === end, sinon "start {separator} end".
 * Le separator doit être traduit par l'appelant (ex: "à", "to", "bis").
 */
export function formatSeasonRange(
  start: string,
  end: string,
  separator: string
): string {
  const s = normalizeSeason(start);
  const e = normalizeSeason(end);
  if (s === e) return s;
  return `${s} ${separator} ${e}`;
}
