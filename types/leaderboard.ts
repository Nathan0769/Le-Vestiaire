export type LeaderboardCategory =
  | "collection_size"
  | "collection_diversity"
  | "league_diversity"
  | "vintage_specialist"
  | "goalkeeper_specialist";

export type LeaderboardPeriod = "month" | "all_time";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  avatarUrl: string | null;
  favoriteClub: {
    id: string;
    name: string;
  } | null;
  score: number;
  metadata?: {
    totalValue?: number;
    monthlyAdditions?: number;
    uniqueClubs?: number;
    uniqueLeagues?: number;
    vintageCount?: number;
    gkCount?: number;
  };
  hasBadge?: boolean;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  lastUpdated: string;
}

export const CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  collection_size: "Plus grosse collection",
  collection_diversity: "Collection la plus diverse",
  league_diversity: "Globe-trotter",
  vintage_specialist: "Spécialiste vintage",
  goalkeeper_specialist: "Gardien de but",
};

export const CATEGORY_DESCRIPTIONS: Record<LeaderboardCategory, string> = {
  collection_size: "Nombre total de maillots possédés",
  collection_diversity: "Nombre de clubs différents",
  league_diversity: "Nombre de ligues différentes",
  vintage_specialist: "Maillots d'avant 2005",
  goalkeeper_specialist: "Maillots de gardien de but",
};
