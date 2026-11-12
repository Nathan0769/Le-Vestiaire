import { compareVersions } from "@/lib/app-version";

/**
 * Annonces de nouveautés : qui voit quelle annonce. Pur, testé.
 * Spec : docs/specs/2026-11-11-annonces-nouveautes.md.
 */

/** Écran ouvert par le bouton de la dernière carte, traduit en lien par chaque app. */
export type AnnouncementTarget = "wishlist" | "collection" | "feed" | "profile";

export interface AnnouncementCard {
  /** Clé des textes : `Announcements.<id>.cards.<key>.title|text`. */
  key: string;
  /** Chemin dans le bucket R2 `static`. */
  image: string;
}

export interface Announcement {
  id: string;
  /** Date de publication (AAAA-MM-JJ, UTC). */
  publishedAt: string;
  /** Version iOS qui contient la nouveauté ; absente = toutes. */
  minIosVersion?: string;
  ctaTarget: AnnouncementTarget;
  cards: AnnouncementCard[];
}

export type AnnouncementPlatform = { kind: "web" } | { kind: "ios"; version: string | null };

/** Au-delà, une annonce n'est plus une nouveauté. */
const MAX_AGE_DAYS = 45;
const DAY_MS = 24 * 3600 * 1000;

const publishedDate = (a: Announcement) => new Date(`${a.publishedAt}T00:00:00Z`);

function iosAllows(a: Announcement, platform: AnnouncementPlatform): boolean {
  if (platform.kind === "web" || !a.minIosVersion) return true;
  if (!platform.version) return false;
  const cmp = compareVersions(platform.version, a.minIosVersion);
  return cmp !== null && cmp >= 0;
}

/**
 * Annonce à montrer, ou null. Une seule à la fois : la plus récente. Fermer
 * une annonce marque aussi les plus anciennes (`idsToMarkSeen`).
 */
export function pickAnnouncement(input: {
  catalog: Announcement[];
  now: Date;
  user: { createdAt: Date; isAdmin: boolean };
  seenIds: Set<string>;
  platform: AnnouncementPlatform;
}): Announcement | null {
  const { now, user } = input;
  const candidates = input.catalog
    .filter((a) => {
      const published = publishedDate(a);
      const isLive = published <= now;
      if (!isLive && !user.isAdmin) return false;
      if (isLive && now.getTime() - published.getTime() > MAX_AGE_DAYS * DAY_MS) return false;
      return user.createdAt < published || !isLive;
    })
    .sort((a, b) => publishedDate(b).getTime() - publishedDate(a).getTime());

  const latest = candidates[0];
  if (!latest || input.seenIds.has(latest.id) || !iosAllows(latest, input.platform)) return null;
  return latest;
}

/** L'annonce fermée et toutes les plus anciennes ; vide si l'id est inconnu. */
export function idsToMarkSeen(catalog: Announcement[], id: string): string[] {
  const closed = catalog.find((a) => a.id === id);
  if (!closed) return [];
  return catalog.filter((a) => publishedDate(a) <= publishedDate(closed)).map((a) => a.id);
}
