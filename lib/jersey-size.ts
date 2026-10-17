/** Tailles acceptées pour un maillot de collection (miroir de l'enum Prisma `Size`). */
export const VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type JerseySizeErrorCode = "SIZE_REQUIRED" | "SIZE_INVALID";

/**
 * Code stable de l'erreur de taille (traduit par l'app mobile), ou null si la
 * taille est valide. La taille est obligatoire : sans elle, un maillot de
 * collection est inexploitable (stats, cote, partage).
 */
export function jerseySizeErrorCode(size: unknown): JerseySizeErrorCode | null {
  if (size === undefined || size === null || size === "") {
    return "SIZE_REQUIRED";
  }
  if (
    typeof size !== "string" ||
    !(VALID_SIZES as readonly string[]).includes(size)
  ) {
    return "SIZE_INVALID";
  }
  return null;
}

export const SIZE_ERROR_MESSAGES: Record<JerseySizeErrorCode, string> = {
  SIZE_REQUIRED: "La taille est obligatoire",
  SIZE_INVALID: "Taille de maillot invalide",
};

/**
 * Valide la taille envoyée par un client (web ou app mobile).
 * Retourne le message d'erreur à renvoyer en 400, ou null si la taille est valide.
 */
export function validateJerseySize(size: unknown): string | null {
  const code = jerseySizeErrorCode(size);
  return code ? SIZE_ERROR_MESSAGES[code] : null;
}
