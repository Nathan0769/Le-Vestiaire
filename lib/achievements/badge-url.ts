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
  "collection.3",
  "collection.15",
  "collection.50",
  "collection.100",
  "wishlist.50",
  "social.follower.first",
  "social.follower.10",
  "social.follower.25",
  "social.follower.50",
  // Contribution (planche stylo 1/10/25/50)
  "contribution.proposal.first",
  "contribution.proposal.10",
  "contribution.proposal.25",
  "contribution.proposal.50",
  // Rareté (planche football, mapping par icône)
  "rarity.signed",
  "rarity.goalkeeper",
  "rarity.certificate",
  "rarity.match_worn",
  // Époque (planche calendrier)
  "rarity.pre2010",
  "rarity.pre2000",
  "rarity.pre1990",
  "rarity.pre1980",
  // Ancienneté (planche gâteaux)
  "loyalty.1year",
  "loyalty.2year",
  "loyalty.3year",
  "loyalty.5year",
]);

const BASE = process.env.NEXT_PUBLIC_R2_STATIC_PUBLIC_URL?.replace(/\/$/, "");

// Bump quand on remplace un visuel de badge, pour casser le cache navigateur/CDN.
const BADGE_VERSION = 2;

/**
 * URL publique du badge d'un succès, ou null s'il n'en a pas.
 * Utilisable côté client (l'URL de base est inlinée au build).
 */
export function getBadgeUrl(key: string): string | null {
  if (!BASE || !BADGE_KEYS.has(key)) return null;
  return `${BASE}/badges/${key}.png?v=${BADGE_VERSION}`;
}
