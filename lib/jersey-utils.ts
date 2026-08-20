/**
 * Ordre d'affichage canonique des types de maillot.
 * Source unique pour le tri sur la fiche (navigation prev/suivant, maillots liés)
 * et la liste par saison, afin d'éviter tout drift entre les deux vues.
 */
export const JERSEY_TYPE_ORDER: Record<string, number> = {
  HOME: 1,
  AWAY: 2,
  THIRD: 3,
  FOURTH: 4,
  SPECIAL: 5,
  HALLOWEEN: 6,
  ANNIVERSARY: 7,
  CENTENAIRE: 8,
  OKTOBERFEST: 9,
  HUMANRACE: 10,
  ONE_PLANET: 11,
  OCTOBRE_ROSE: 12,
  ANTI_RACISME: 13,
  HOMMAGE: 14,
  RETRO: 15,
  NOUVEL_AN_CHINOIS: 16,
  OFF_WHITE: 17,
  KOCHE: 18,
  CHAMPION: 19,
  GOALKEEPER: 20,
};

export function jerseyTypeLabel(
  baseLabel: string,
  type: string,
  variant: number
): string {
  if (type === "GOALKEEPER" && variant > 1) {
    return `${baseLabel} ${variant}`;
  }
  return baseLabel;
}
