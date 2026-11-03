const pad2 = (n: number) => String(n % 100).padStart(2, "0");

/**
 * Saisons couvertes par un maillot porté plusieurs saisons ("2008-10" ->
 * 2008-09 et 2009-10). Vide pour une saison simple ou une année.
 */
function spanBounds(season: string): { start: number; end: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(season);
  if (!m) return null;
  const start = Number(m[1]);
  let end = start - (start % 100) + Number(m[2]);
  if (end <= start) end += 100;
  return { start, end };
}

export function spanSeasons(season: string): string[] {
  const bounds = spanBounds(season);
  if (!bounds || bounds.end - bounds.start < 2) return [];
  return Array.from({ length: bounds.end - bounds.start }, (_, i) => `${bounds.start + i}-${pad2(bounds.start + i + 1)}`);
}

/**
 * Saisons à essayer, par ordre de préférence, pour retrouver un maillot du catalogue.
 * Le catalogue range les sélections par année ("2022") et les clubs par saison
 * ("2024-25"), alors qu'une boutique peut écrire l'un pour l'autre, ou une
 * période de plusieurs saisons ("2008-10").
 */
export function seasonCandidates(season: string): string[] {
  const bounds = spanBounds(season);
  if (bounds) {
    // Sélections rangées par année : "2005-07" est le maillot de 2006 au catalogue.
    const years = Array.from({ length: bounds.end - bounds.start + 1 }, (_, i) => String(bounds.start + i));
    return [season, ...spanSeasons(season), ...years];
  }

  if (/^\d{4}$/.test(season)) {
    const year = Number(season);
    return [season, `${year}-${pad2(year + 1)}`, `${year - 1}-${pad2(year)}`];
  }

  return [season];
}
