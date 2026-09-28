import type { PatchVariant } from "@prisma/client";

// Un maillot ne porte qu'un seul badge de manche LDC. Précédence :
// tenant du titre (LDC ou EL) > badge of honour > starball.
const RANK: Record<PatchVariant, number> = {
  UEFA_TITLE_HOLDER: 3,
  UEFA_EL_TITLE_HOLDER: 3,
  UEFA_BADGE_OF_HONOUR: 2,
  UEFA_STARBALL: 1,
};

export function getUefaBadgeRank(variant: PatchVariant | null): number {
  return variant === null ? 1 : RANK[variant];
}

export interface UefaBadgeCandidate {
  id: string;
  variant: PatchVariant | null;
  // honour / tenant ne comptent que s'ils ont une version couvrant la saison du
  // maillot (c'est ainsi qu'on encode le bon numéro ou la bonne saison de tenant).
  hasActiveVersion: boolean;
}

// Retourne l'id du badge de plus haut rang à conserver, ou null si aucun
// candidat retenu. Un candidat honour/tenant sans version active est écarté.
export function pickTopUefaBadgeId(
  candidates: UefaBadgeCandidate[]
): string | null {
  let best: UefaBadgeCandidate | null = null;
  let bestRank = 0;

  for (const c of candidates) {
    const rank = getUefaBadgeRank(c.variant);
    // Le starball (rang 1) reste valable sans version ; les rangs supérieurs
    // exigent une version active pour être fidèles.
    if (rank > 1 && !c.hasActiveVersion) continue;
    if (rank > bestRank) {
      best = c;
      bestRank = rank;
    }
  }

  return best?.id ?? null;
}
