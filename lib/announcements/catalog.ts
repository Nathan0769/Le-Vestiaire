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
    // Choix de Nathan : le jour du démarrage des alertes promo (PROMO_ALERTS_START).
    // Sur iOS, visible seulement à partir de la 1.7 (minIosVersion).
    publishedAt: "2026-11-16",
    minIosVersion: "1.7",
    ctaTarget: "wishlist",
    // Une seule page, sans capture (choix de Nathan) : trois lignes icône, titre, phrase.
    cards: [
      {
        key: "main",
        items: [
          { key: "list", icon: "gift" },
          { key: "share", icon: "link" },
          { key: "alerts", icon: "bell" },
        ],
      },
    ],
  },
];
