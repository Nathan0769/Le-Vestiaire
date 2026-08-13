import type { PatchFamily } from "@prisma/client";

export type PatchExclusivityGroup = "DOMESTIC" | "CONTINENTAL";

// Un flocage matchday est soit "version championnat" (badges domestiques), soit
// "version continentale/internationale" (compétitions inter-clubs). Les deux ne
// coexistent jamais physiquement sur le même maillot.
const DOMESTIC_LEAGUE_FAMILIES = new Set<PatchFamily>([
  "DOMESTIC_LEAGUE_BADGE",
  "DOMESTIC_CHAMPION",
]);

const CONTINENTAL_CLUB_FAMILIES = new Set<PatchFamily>([
  "UEFA_COMPETITION",
  "CONFED_CLUB_COMPETITION",
  "FIFA_CLUB_COMPETITION",
]);

export function getExclusivityGroup(
  family: PatchFamily
): PatchExclusivityGroup | null {
  if (DOMESTIC_LEAGUE_FAMILIES.has(family)) return "DOMESTIC";
  if (CONTINENTAL_CLUB_FAMILIES.has(family)) return "CONTINENTAL";
  return null;
}

// Groupe verrouillé par la sélection courante : le premier groupe contraint
// rencontré. null si aucun patch contraint n'est sélectionné.
export function getLockedGroup(
  families: PatchFamily[]
): PatchExclusivityGroup | null {
  for (const family of families) {
    const group = getExclusivityGroup(family);
    if (group) return group;
  }
  return null;
}

// True si la sélection contient à la fois un badge championnat et un badge de
// compétition continentale.
export function hasExclusivityConflict(families: PatchFamily[]): boolean {
  let hasDomestic = false;
  let hasContinental = false;
  for (const family of families) {
    const group = getExclusivityGroup(family);
    if (group === "DOMESTIC") hasDomestic = true;
    else if (group === "CONTINENTAL") hasContinental = true;
  }
  return hasDomestic && hasContinental;
}
