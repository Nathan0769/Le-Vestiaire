export type TopClubEntry = {
  id: string;
  name: string;
  logoUrl: string;
  count: number;
};

export type TopLeagueEntry = {
  id: string;
  name: string;
  logoUrl: string;
  count: number;
};

export type TopBrandEntry = {
  name: string;
  count: number;
};

export type MostOwnedJersey = {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  imageUrl: string;
  ownersCount: number;
};

export type TopRatedJersey = {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  imageUrl: string;
  averageRating: number;
  votesCount: number;
};

export type TopSeason = {
  season: string;
  count: number;
};

export type GlobalStats = {
  topClubs: TopClubEntry[];
  topLeagues: TopLeagueEntry[];
  topBrands: TopBrandEntry[];
  mostOwnedJersey: MostOwnedJersey | null;
  topRatedJersey: TopRatedJersey | null;
  topSeason: TopSeason | null;
  acquisitionsThisMonth: number;
  catalogCoverage: number;
  totalCollectedJerseys: number;
  averageRating: number | null;
};

export type RareJersey = {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  imageUrl: string;
  ownersCount: number;
};

export type FavoriteClubCoverage = {
  clubId: string;
  clubName: string;
  clubLogoUrl: string;
  leagueId: string;
  ownedCount: number;
  totalCount: number;
  percentage: number;
};

export type UserComparison = {
  favoriteClubCoverage: FavoriteClubCoverage | null;
  rarestJerseys: RareJersey[];
};

export type CommunityStatsResponse = {
  global: GlobalStats;
  comparison: UserComparison | null;
};
