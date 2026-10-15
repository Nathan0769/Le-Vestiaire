/**
 * Choisit le club dont on mesure la couverture : le club favori s'il est défini
 * (même à 0 maillot, c'est un objectif), sinon le club le plus présent en
 * maillots différents. Ex aequo départagés par id pour un résultat stable.
 */
export function pickCoverageClub(
  favoriteClubId: string | null,
  distinctOwnedByClub: Map<string, number>
): { clubId: string; isFavorite: boolean } | null {
  if (favoriteClubId) return { clubId: favoriteClubId, isFavorite: true };

  let best: { clubId: string; count: number } | null = null;
  for (const [clubId, count] of distinctOwnedByClub) {
    if (
      !best ||
      count > best.count ||
      (count === best.count && clubId < best.clubId)
    ) {
      best = { clubId, count };
    }
  }
  return best ? { clubId: best.clubId, isFavorite: false } : null;
}
