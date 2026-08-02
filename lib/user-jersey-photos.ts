/**
 * Logique metier des photos perso d'un maillot de collection.
 *
 * Les photos sont stockees comme un tableau ordonne de paths R2 sur
 * `UserJersey.userPhotoUrls` (index 0 = photo principale). Le plafond est une
 * regle metier ici, pas une contrainte de schema, pour pouvoir l'ajuster par
 * tier (ex : Supporter) sans migration.
 */

export const MAX_USER_JERSEY_PHOTOS = 2;
export const MAX_USER_JERSEY_PHOTOS_SUPPORTER = 4;

/** Plafond de photos perso selon le tier (Supporter = plus de photos). */
export function maxUserJerseyPhotos(isSupporter: boolean): number {
  return isSupporter ? MAX_USER_JERSEY_PHOTOS_SUPPORTER : MAX_USER_JERSEY_PHOTOS;
}

export type NormalizeResult =
  | { ok: true; paths: string[] }
  | { ok: false; error: string };

/**
 * Valide et normalise l'entree client en tableau de paths R2.
 * Accepte un tableau, une string unique (compat ancien champ `userPhotoUrl`),
 * ou null/undefined (= aucune photo). Filtre les vides, dedupe, plafonne a MAX.
 */
export function normalizeUserPhotoPaths(
  input: unknown,
  max: number = MAX_USER_JERSEY_PHOTOS
): NormalizeResult {
  if (input === null || input === undefined) {
    return { ok: true, paths: [] };
  }

  let raw: unknown[];
  if (typeof input === "string") {
    raw = [input];
  } else if (Array.isArray(input)) {
    raw = input;
  } else {
    return { ok: false, error: "Les photos doivent etre un tableau" };
  }

  const paths: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") {
      return { ok: false, error: "Chaque photo doit etre une chaine de caracteres" };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    if (!paths.includes(trimmed)) {
      paths.push(trimmed);
    }
  }

  if (paths.length > max) {
    return {
      ok: false,
      error: `Vous ne pouvez pas ajouter plus de ${max} photos`,
    };
  }

  return { ok: true, paths };
}

/**
 * Paths presents dans `existing` mais absents de `next` : a supprimer de R2.
 */
export function getRemovedPhotoPaths(
  existing: string[],
  next: string[]
): string[] {
  return existing.filter((path) => !next.includes(path));
}
