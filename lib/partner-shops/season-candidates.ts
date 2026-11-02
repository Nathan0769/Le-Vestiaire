const pad2 = (n: number) => String(n % 100).padStart(2, "0");

/**
 * Saisons à essayer, par ordre de préférence, pour retrouver un maillot du catalogue.
 * Le catalogue range les sélections par année ("2022") et les clubs par saison
 * ("2024-25"), alors qu'une boutique peut écrire l'un pour l'autre.
 */
export function seasonCandidates(season: string): string[] {
  const span = /^(\d{4})-\d{2}$/.exec(season);
  if (span) return [season, span[1]];

  if (/^\d{4}$/.test(season)) {
    const year = Number(season);
    return [season, `${year}-${pad2(year + 1)}`, `${year - 1}-${pad2(year)}`];
  }

  return [season];
}
