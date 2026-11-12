import type { Announcement } from "@/lib/announcements/pick";

/**
 * Annonces de nouveautés, de la plus ancienne à la plus récente. Textes dans
 * `messages/<langue>.json` (`Announcements.<id>`), images sur R2 `static`
 * (`scripts/announcements/upload-images.ts`). Une annonce = un chantier visible
 * par l'utilisateur, validé par Nathan (règle dans CLAUDE.md).
 */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "2026-12-wishlist-noel",
    // Sortie de l'iOS 1.7 ; à caler sur la date réelle de validation Apple.
    publishedAt: "2026-12-05",
    minIosVersion: "1.7",
    ctaTarget: "wishlist",
    cards: [
      { key: "list", image: "announcements/2026-12-wishlist-noel/list-v2.jpg" },
      { key: "share", image: "announcements/2026-12-wishlist-noel/share.jpg" },
      { key: "alerts", image: "announcements/2026-12-wishlist-noel/alerts.jpg" },
    ],
  },
];
