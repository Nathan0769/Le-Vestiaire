import {
  Shirt,
  Layers,
  Users,
  Trophy,
  Calendar,
  Gem,
  PenLine,
  type LucideIcon,
} from "lucide-react";

/** Icône par catégorie de succès. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  COLLECTION: Shirt,
  DIVERSITY: Layers,
  SOCIAL: Users,
  LEADERBOARD: Trophy,
  LOYALTY: Calendar,
  RARITY: Gem,
  CONTRIBUTION: PenLine,
};

export const ACHIEVEMENT_CATEGORIES = [
  "COLLECTION",
  "DIVERSITY",
  "SOCIAL",
  "LEADERBOARD",
  "LOYALTY",
  "RARITY",
  "CONTRIBUTION",
] as const;

/** Dégradé du disque de médaille par palier (état débloqué). */
export const TIER_DISC: Record<string, string> = {
  BRONZE:
    "bg-gradient-to-br from-amber-400 to-amber-700 text-white shadow-lg shadow-amber-700/30",
  SILVER:
    "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-500/30",
  GOLD: "bg-gradient-to-br from-yellow-300 to-yellow-600 text-white shadow-lg shadow-yellow-600/30",
  PLATINUM:
    "bg-gradient-to-br from-indigo-300 to-indigo-600 text-white shadow-lg shadow-indigo-600/30",
};

/** Couleur d'accent texte par palier. */
export const TIER_TEXT: Record<string, string> = {
  BRONZE: "text-amber-700 dark:text-amber-500",
  SILVER: "text-slate-500 dark:text-slate-300",
  GOLD: "text-yellow-600 dark:text-yellow-400",
  PLATINUM: "text-indigo-600 dark:text-indigo-400",
};

/** Poids de tri des paliers (du plus prestigieux au moins). */
export const TIER_WEIGHT: Record<string, number> = {
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

export function tierWeight(tier: string | null): number {
  return tier ? TIER_WEIGHT[tier] ?? 0 : 0;
}

/**
 * Formate un ratio de rareté (0..1) en pourcentage lisible.
 * Sous 1 %, on affiche "< 1 %" plutôt qu'un arrondi à 0.
 */
export function formatRarity(ratio: number): string {
  const pct = ratio * 100;
  if (pct > 0 && pct < 1) return "< 1 %";
  return `${Math.round(pct)} %`;
}
