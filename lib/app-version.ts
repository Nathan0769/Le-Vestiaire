/**
 * Version minimale de l'app iOS. `null` en temps normal : aucune version n'est
 * bloquée, l'API reste compatible avec les anciennes (spec
 * docs/specs/2026-10-15-app-version.md).
 *
 * Soupape d'urgence uniquement (faille ou bug grave sur une version publiée) :
 * renseigner la première version saine, ex. "1.7". Les versions en dessous
 * affichent l'écran « Mise à jour requise ». Les versions 1.3 à 1.5 n'ont pas
 * cet écran et ne sont donc pas concernées.
 */
export const IOS_MINIMUM_VERSION: string | null = null;

function parts(version: string): number[] | null {
  if (!/^\d+(\.\d+)*$/.test(version)) return null;
  return version.split(".").map(Number);
}

/** -1, 0 ou 1 selon que `a` est plus ancienne, égale ou plus récente que `b` ; null si illisible. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 | null {
  const pa = parts(a);
  const pb = parts(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * Une version absente ou illisible n'est jamais bloquée : mieux vaut laisser
 * passer que verrouiller l'app sur une valeur inattendue.
 */
export function isUpdateRequired(
  version: string | null,
  minimum: string | null
): boolean {
  if (!version || !minimum) return false;
  return compareVersions(version, minimum) === -1;
}
