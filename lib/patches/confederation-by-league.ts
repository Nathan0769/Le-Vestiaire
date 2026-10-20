import type { Confederation } from "@/types/patch";

export const CONFEDERATION_BY_LEAGUE_ID: Record<string, Confederation> = {
  "ligue-1": "UEFA",
  "ligue-2": "UEFA",
  "ligue-3": "UEFA",
  "national": "UEFA",
  "premier-league": "UEFA",
  "efl-championship": "UEFA",
  "efl-league-one": "UEFA",
  "la-liga": "UEFA",
  "la-liga-2": "UEFA",
  "bundesliga": "UEFA",
  "bundesliga-2": "UEFA",
  "bundesliga-3": "UEFA",
  "serie-a": "UEFA",
  "serie-b": "UEFA",
  "serie-c": "UEFA",
  "liga-portugal": "UEFA",
  "liga-portugal-2": "UEFA",
  "liga-3-portugal": "UEFA",
  "eredivisie": "UEFA",
  "eerste-divisie": "UEFA",
  "jupiler-pro-league": "UEFA",
  "challenger-pro-league": "UEFA",
  "swiss-super-league": "UEFA",
  "austrian-bundesliga": "UEFA",
  "superlig": "UEFA",
  "scottish-premiership": "UEFA",
  "ukrainian-premier-league": "UEFA",
  "greek-super-league": "UEFA",
  "chance-liga": "UEFA",
  "danish-superliga": "UEFA",
  "allsvenskan": "UEFA",
  "hnl": "UEFA",
  "parva-liga": "UEFA",
  "toplyga": "UEFA",
  "bgl-ligue": "UEFA",
  "eliteserien": "UEFA",
  "ekstraklasa": "UEFA",
  "russian-premier-league": "UEFA",

  "mls": "CONCACAF",
  "liga-mx": "CONCACAF",

  "saudi-pro-league": "AFC",
  "j1-league": "AFC",

  "brasileiro-serie-a": "CONMEBOL",
  "primera-division-argentina": "CONMEBOL",
};

export const NATIONAL_TEAM_LEAGUE_IDS = [
  "uefa",
  "caf",
  "concacaf",
  "conmebol",
  "afc",
  "ofc",
] as const;

export function getConfederationForLeague(leagueId: string): Confederation | null {
  return CONFEDERATION_BY_LEAGUE_ID[leagueId] ?? null;
}

export function isNationalTeamLeague(leagueId: string): boolean {
  return (NATIONAL_TEAM_LEAGUE_IDS as readonly string[]).includes(leagueId);
}
