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
  {
    id: "2026-12-app-de",
    // App en allemand (iOS 1.7.1) ; le web était déjà traduit. minIosVersion la
    // retient jusqu'à la mise à jour, d'où une date au jour de l'écriture.
    publishedAt: "2026-11-17",
    minIosVersion: "1.7.1",
    locales: ["de"],
    platforms: ["ios"],
    ctaTarget: "wishlist",
    cards: [
      {
        key: "main",
        items: [
          { key: "language", icon: "shirt" },
          { key: "shop", icon: "tag" },
          { key: "gift", icon: "gift" },
        ],
      },
    ],
  },
  {
    id: "2026-11-cote-precise",
    // Phase 2 de la cote (spec docs/specs/2026-11-22-cote-phase-2.md). Sur iOS, la
    // page Valeur n'affiche fourchette et sources qu'à partir de la 1.7.2.
    publishedAt: "2026-11-22",
    minIosVersion: "1.7.2",
    ctaTarget: "collection",
    cards: [
      {
        key: "main",
        items: [
          { key: "sales", icon: "chart" },
          { key: "jersey", icon: "shirt" },
          { key: "where", icon: "tag" },
        ],
      },
    ],
  },
];
