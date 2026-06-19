export type ClubSeasonLeagueEntry = { season: string; leagueId: string };

export type ResolveContext = {
  season: string;
  club: {
    leagueId: string;
    seasonLeagues?: ClubSeasonLeagueEntry[];
  };
};

export function resolveJerseyLeagueIdFromContext(ctx: ResolveContext): string {
  const historical = ctx.club.seasonLeagues?.find(
    (sl) => sl.season === ctx.season
  );
  return historical?.leagueId ?? ctx.club.leagueId;
}
