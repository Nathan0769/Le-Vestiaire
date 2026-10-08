/** Tailles acceptées pour un maillot de collection (miroir de l'enum Prisma `Size`). */
export const VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/**
 * Valide la taille envoyée par un client (web ou app mobile).
 * Retourne le message d'erreur à renvoyer en 400, ou null si la taille est valide.
 * La taille est obligatoire : sans elle, un maillot de collection est inexploitable
 * (stats, cote, partage).
 */
export function validateJerseySize(size: unknown): string | null {
  if (size === undefined || size === null || size === "") {
    return "La taille est obligatoire";
  }
  if (
    typeof size !== "string" ||
    !(VALID_SIZES as readonly string[]).includes(size)
  ) {
    return "Taille de maillot invalide";
  }
  return null;
}
