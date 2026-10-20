import { describe, it, expect } from "vitest";
import { getConfederationForLeague } from "./confederation-by-league";

describe("getConfederationForLeague", () => {
  it.each([
    ["brasileiro-serie-a", "CONMEBOL"],
    ["primera-division-argentina", "CONMEBOL"],
    ["superlig", "UEFA"],
    ["efl-league-one", "UEFA"],
    ["challenger-pro-league", "UEFA"],
    ["ligue-3", "UEFA"],
    ["national", "UEFA"],
    ["eliteserien", "UEFA"],
    ["eerste-divisie", "UEFA"],
    ["ekstraklasa", "UEFA"],
    ["russian-premier-league", "UEFA"],
  ])("%s -> %s (id de la ligue en base)", (leagueId, confederation) => {
    expect(getConfederationForLeague(leagueId)).toBe(confederation);
  });
});
