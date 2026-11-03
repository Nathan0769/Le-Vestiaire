const pad2 = (n: number) => String(n % 100).padStart(2, "0");

/**
 * Saisons couvertes par un maillot porté plusieurs saisons ("2008-10" ->
 * 2008-09 et 2009-10). Vide pour une saison simple ou une année.
 */
export function spanSeasons(season: string): string[] {
  const m = /^(\d{4})-(\d{2})$/.exec(season);
  if (!m) return [];
  const start = Number(m[1]);
  const century = start - (start % 100);
  let end = century + Number(m[2]);
  if (end <= start) end += 100;
  if (end - start < 2) return [];
  return Array.from({ length: end - start }, (_, i) => `${start + i}-${pad2(start + i + 1)}`);
}

/**
 * Saisons à essayer, par ordre de préférence, pour retrouver un maillot du catalogue.
 * Le catalogue range les sélections par année ("2022") et les clubs par saison
 * ("2024-25"), alors qu'une boutique peut écrire l'un pour l'autre, ou une
 * période de plusieurs saisons ("2008-10").
 */
export function seasonCandidates(season: string): string[] {
  const span = /^(\d{4})-\d{2}$/.exec(season);
  if (span) return [season, ...spanSeasons(season), span[1]];

  if (/^\d{4}$/.test(season)) {
    const year = Number(season);
    return [season, `${year}-${pad2(year + 1)}`, `${year - 1}-${pad2(year)}`];
  }

  return [season];
}
