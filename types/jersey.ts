export interface Jersey {
  id: string;
  name: string;
  clubId: string;
  season: string;
  type: JerseyType;
  brand: string;
  imageUrl: string;
  retailPrice?: number;
  club: Club;
  createdAt: Date;
  updatedAt: Date;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  logoUrl: string;
  primaryColor: string;
  league: League;
}

export interface League {
  id: string;
  name: string;
  country: string;
  logoUrl: string;
  tier: number;
}

export enum JerseyType {
  HOME = "HOME",
  AWAY = "AWAY",
  THIRD = "THIRD",
  GOALKEEPER = "GOALKEEPER",
  SPECIAL = "SPECIAL",
}

export interface JerseyFilters {
  search?: string;
  clubIds?: string[];
  seasons?: string[];
  types?: JerseyType[];
  brands?: string[];
  priceRange?: [number, number];
}
