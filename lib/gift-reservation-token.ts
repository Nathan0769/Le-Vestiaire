import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * « Je l'offre » sans compte : le proche garde un jeton dans son navigateur,
 * la base n'en stocke que le hash. Le jeton seul permet d'annuler.
 */

export const GIFT_NAME_MAX = 40;

export function normalizeGiftName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length === 0 || name.length > GIFT_NAME_MAX ? null : name;
}

export function newReservationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashReservationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Comparaison à temps constant : la durée ne renseigne pas sur le hash stocké.
export function tokenMatches(token: string | null | undefined, storedHash: string): boolean {
  if (!token) return false;
  const a = Buffer.from(hashReservationToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
