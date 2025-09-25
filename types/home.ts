export type TopRatedJersey = {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  brand: string;
  club: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string | null;
    primaryColor: string | null;
    leagueId: string | null;
    league: {
      id: string | null;
      name: string | null;
      country: string | null;
      logoUrl: string | null;
      tier: number | null;
    };
  };
  averageRating: number;
  totalRatings: number;
};

export interface RecentJersey {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  brand: string;
  createdAt: string;
  club: {
    id: string;
    name: string;
    league: {
      id: string | null;
      name: string;
    };
  };
}

export interface UserHomeStats {
  collection: {
    total: number;
    totalValue: number | null;
    recentItems: Array<{
      id: string;
      jersey: {
        id: string;
        name: string;
        imageUrl: string;
        type: string;
        club: {
          id: string;
          name: string;
          shortName: string;
          league: {
            id: string;
            name: string;
          };
        };
      };
      purchasePrice: number | null;
      createdAt: string;
    }>;
    leagueStats: Record<string, number>;
  };
  wishlist: {
    total: number;
    recentItems: Array<{
      id: string;
      jersey: {
        id: string;
        name: string;
        imageUrl: string;
        type: string;
        club: {
          id: string;
          name: string;
          shortName: string;
          league: {
            id: string;
            name: string;
          };
        };
      };
      createdAt: string;
    }>;
  };
}

export interface HomeApiResponses {
  topRated: {
    jerseys: TopRatedJersey[];
    total: number;
  };
  recent: {
    jerseys: RecentJersey[];
    total: number;
  };
  userStats: UserHomeStats;
}

export type TopRatedRow = {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  brand: string;
  club_id: string;
  club_name: string;
  club_short_name: string;
  club_logo_url: string | null;
  club_primary_color: string | null;
  league_id: string | null;
  league_name: string | null;
  league_country: string | null;
  league_logo_url: string | null;
  league_tier: number | null;
  average_rating: number;
  total_ratings: number;
};

export type CollectionStatsRow = {
  total: number;
  total_value: number | null;
};

export type WishlistStatsRow = {
  total: number;
};

export type LeagueStatsRow = {
  league_name: string;
  count: number;
};

export type RecentJerseyDb = Omit<RecentJersey, "createdAt"> & {
  createdAt: Date;
};

export type RecentJerseyRow = {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  brand: string;
  createdAt: Date;
  club_id: string;
  club_name: string;
};

export interface RawResult {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  brand: string;
  createdAt: Date;
  club_id: string;
  club_name: string;
  league_id: string | null;
  league_name: string | null;
}
