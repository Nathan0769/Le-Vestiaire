import { STATIC_BUCKET, getR2PublicUrl } from "@/lib/r2-storage";

/**
 * Succès disposant d'un badge illustré (image sur R2 static).
 * Les autres retombent sur la médaille CSS générée par palier.
 */
const BADGE_KEYS = [
  "social.rating.20",
  "social.rating.50",
  "social.rating.100",
  "social.rating.200",
] as const;

/**
 * Map clé de succès -> URL publique du badge sur R2.
 * Construite côté serveur (les URLs publiques R2 ne sont pas exposées au client),
 * puis transmise au client via la réponse achievements.
 */
export function getAchievementBadges(): Record<string, string> {
  if (!STATIC_BUCKET) return {};
  const map: Record<string, string> = {};
  for (const key of BADGE_KEYS) {
    map[key] = getR2PublicUrl(STATIC_BUCKET, `badges/${key}.png`);
  }
  return map;
}
