import type { Confederation } from "@/types/patch";

export const CONFEDERATION_BY_LEAGUE_ID: Record<string, Confederation> = {
  "ligue-1": "UEFA",
  "ligue-2": "UEFA",
  "premier-league": "UEFA",
  "efl-championship": "UEFA",
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
  "jupiler-pro-league": "UEFA",
  "swiss-super-league": "UEFA",
  "austrian-bundesliga": "UEFA",
  "super-lig": "UEFA",
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

  "mls": "CONCACAF",
  "liga-mx": "CONCACAF",

  "saudi-pro-league": "AFC",
  "j1-league": "AFC",

  "brasileirao": "CONMEBOL",
};

export const NATIONAL_TEAM_LEAGUE_IDS = ["national", "national-2"] as const;

export function getConfederationForLeague(leagueId: string): Confederation | null {
  return CONFEDERATION_BY_LEAGUE_ID[leagueId] ?? null;
}

export function isNationalTeamLeague(leagueId: string): boolean {
  return (NATIONAL_TEAM_LEAGUE_IDS as readonly string[]).includes(leagueId);
}
