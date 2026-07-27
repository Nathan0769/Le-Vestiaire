/**
 * Catalogue cosmétique Supporter. Chaque cosmétique mappe une clé stockée en
 * base vers une classe CSS définie dans `app/globals.css` (préfixe `cos-`).
 *
 * Les cosmétiques ne sont rendus que si l'utilisateur est supporter actif
 * (voir `isSupporter` dans `lib/subscription.ts`) : les getters renvoient une
 * chaîne vide sinon, ce qui masque automatiquement les cosmétiques après un
 * downgrade sans nettoyer les colonnes.
 */

export type Cosmetic = {
  /** Clé de traduction du libellé (Settings.cosmetics.*). */
  label: string;
  /** Classe CSS appliquée au rendu. */
  className: string;
};

/** Contours d'avatar — choisis par le supporter. */
export const FRAMES = {
  "gold-foil": { label: "goldFoil", className: "cos-ring-gold-foil" },
  "gold-engraved": { label: "goldEngraved", className: "cos-ring-gold-engraved" },
  nocturne: { label: "nocturne", className: "cos-ring-nocturne" },
} as const satisfies Record<string, Cosmetic>;

/** Bannières de profil — choisies par le supporter. */
export const BANNERS = {
  atelier: { label: "atelier", className: "cos-banner-atelier" },
  onyx: { label: "onyx", className: "cos-banner-onyx" },
  nuit: { label: "nuit", className: "cos-banner-nuit" },
} as const satisfies Record<string, Cosmetic>;

export type FrameKey = keyof typeof FRAMES;
export type BannerKey = keyof typeof BANNERS;

export function isValidFrame(key: string | null | undefined): key is FrameKey {
  return typeof key === "string" && key in FRAMES;
}

export function isValidBanner(key: string | null | undefined): key is BannerKey {
  return typeof key === "string" && key in BANNERS;
}

/** Classe du contour d'avatar, ou "" si non-supporter / clé invalide. */
export function getAvatarFrameClass(
  frame: string | null | undefined,
  isSupporter: boolean
): string {
  if (!isSupporter || !isValidFrame(frame)) return "";
  return FRAMES[frame].className;
}

/** Classe de la bannière de profil, ou "" si non-supporter / clé invalide. */
export function getBannerClass(
  banner: string | null | undefined,
  isSupporter: boolean
): string {
  if (!isSupporter || !isValidBanner(banner)) return "";
  return BANNERS[banner].className;
}
