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
  logoDarkUrl: string | null;
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

export type CollectionPieces = {
  signed: number;
  matchWorn: number;
  playerIssue: number;
  withCertificate: number;
  /** Collectionneurs distincts possédant au moins une pièce (signée, portée, player issue ou certifiée). */
  collectorsWithPiece: number;
};

export type GlobalStats = {
  topClubs: TopClubEntry[];
  topLeagues: TopLeagueEntry[];
  topBrands: TopBrandEntry[];
  mostOwnedJersey: MostOwnedJersey | null;
  topRatedJersey: TopRatedJersey | null;
  topSeason: TopSeason | null;
  topSeasons: TopSeason[];
  acquisitionsThisMonth: number;
  catalogCoverage: number;
  totalCollectedJerseys: number;
  totalCollectors: number;
  averageRating: number | null;
  collectionPieces: CollectionPieces;
};

export type CommunityStatsResponse = {
  global: GlobalStats;
};
