const BASE_URL = "https://v3.football.api-sports.io";

export const LIGUE1_ID = 61;

export interface ApiFootballTeam {
  team: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  venue: {
    name: string;
    city: string;
  };
}

export interface ApiFootballStandingEntry {
  rank: number;
  team: { id: number; name: string };
  points: number;
}

interface ApiFootballLeagueStandings {
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    standings: ApiFootballStandingEntry[][];
  };
}

export interface ApiFootballFixture {
  fixture: {
    id: number;
    status: { short: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
  };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
}

function getApiKey(): string {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Variable d'environnement API_FOOTBALL_KEY manquante");
  return key;
}

async function apiFetch<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "x-apisports-key": getApiKey(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API-Football ${res.status} sur ${endpoint}`);
  }

  const data = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    const msg = Object.values(data.errors).join(", ");
    throw new Error(`API-Football erreur: ${msg}`);
  }

  return data.response as T[];
}

export async function getTeamsByLeague(
  leagueId: number,
  season: number
): Promise<ApiFootballTeam[]> {
  return apiFetch<ApiFootballTeam>(`/teams?league=${leagueId}&season=${season}`);
}

// season = start year, e.g. 2023 for the 2023/24 season
export async function getLeagueStandings(
  leagueId: number,
  season: number
): Promise<ApiFootballStandingEntry[]> {
  const results = await apiFetch<ApiFootballLeagueStandings>(
    `/standings?league=${leagueId}&season=${season}`
  );
  return results[0]?.league.standings[0] ?? [];
}

// Returns completed fixtures for a cup competition in a given season.
// roundFilter = "Final" for multi-round cups, null for single-match competitions (e.g. Trophée des Champions)
export async function getCupFinalFixtures(
  leagueId: number,
  season: number,
  roundFilter: string | null = "Final"
): Promise<ApiFootballFixture[]> {
  const endpoint = roundFilter
    ? `/fixtures?league=${leagueId}&season=${season}&round=${encodeURIComponent(roundFilter)}`
    : `/fixtures?league=${leagueId}&season=${season}`;
  const results = await apiFetch<ApiFootballFixture>(endpoint);
  // FT = full time, AET = after extra time, PEN = penalties
  return results.filter((f) => ["FT", "AET", "PEN"].includes(f.fixture.status.short));
}
