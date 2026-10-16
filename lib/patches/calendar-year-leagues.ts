// Ligues dont les saisons suivent l'année civile : maillots et versions de patch en "YYYY".
export const CALENDAR_YEAR_LEAGUE_IDS = [
  "mls",
  "brasileiro-serie-a",
  "allsvenskan",
] as const;

export function isCalendarYearLeague(
  leagueId: string | null | undefined
): boolean {
  if (!leagueId) return false;
  return (CALENDAR_YEAR_LEAGUE_IDS as readonly string[]).includes(
    leagueId.toLowerCase()
  );
}
