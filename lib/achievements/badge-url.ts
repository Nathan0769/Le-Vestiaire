/**
 * Clés de succès disposant d'un badge illustré (image sur R2 static).
 * Les autres retombent sur la médaille CSS générée par palier.
 */
export const BADGE_KEYS = new Set<string>([
  "social.rating.20",
  "social.rating.50",
  "social.rating.100",
  "social.rating.200",
  "diversity.leagues.3",
  "diversity.leagues.5",
  "diversity.leagues.15",
  "diversity.leagues.100",
]);

const BASE = process.env.NEXT_PUBLIC_R2_STATIC_PUBLIC_URL?.replace(/\/$/, "");

/**
 * URL publique du badge d'un succès, ou null s'il n'en a pas.
 * Utilisable côté client (l'URL de base est inlinée au build).
 */
export function getBadgeUrl(key: string): string | null {
  if (!BASE || !BADGE_KEYS.has(key)) return null;
  return `${BASE}/badges/${key}.png`;
}
