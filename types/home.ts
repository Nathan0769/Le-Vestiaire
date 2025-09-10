export interface TopRatedJersey {
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
    leagueId: string;
    logoUrl: string;
    primaryColor: string;
    league: {
      id: string;
      name: string;
      country: string;
      logoUrl: string;
      tier: number;
    };
  };
  averageRating: number;
  totalRatings: number;
}

export interface RecentJersey {
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
    leagueId: string;
    logoUrl: string;
    primaryColor: string;
    league: {
      id: string;
      name: string;
      country: string;
      logoUrl: string;
      tier: number;
    };
  };
  createdAt: string;
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
