export interface StatsInput {
  id: string;
  purchasePrice: number | null;
  jersey: {
    club: {
      id: string;
      league: {
        id: string;
        country: string;
      };
    };
  };
}

export interface CollectionStats {
  total: number;
  clubs: number;
  leagues: number;
  countries: number;
  estimatedValue: number;
}

export function computeCollectionStats(items: StatsInput[]): CollectionStats {
  const clubIds = new Set<string>();
  const leagueIds = new Set<string>();
  const countries = new Set<string>();
  let estimatedValue = 0;

  for (const item of items) {
    clubIds.add(item.jersey.club.id);
    leagueIds.add(item.jersey.club.league.id);
    countries.add(item.jersey.club.league.country);
    if (item.purchasePrice !== null) {
      estimatedValue += item.purchasePrice;
    }
  }

  return {
    total: items.length,
    clubs: clubIds.size,
    leagues: leagueIds.size,
    countries: countries.size,
    estimatedValue,
  };
}
