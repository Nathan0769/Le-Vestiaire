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
  username: string | null;
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
