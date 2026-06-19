import { describe, it, expect } from "vitest";
import { resolveJerseyLeagueIdFromContext } from "@/lib/club-season-league/resolve";

describe("resolveJerseyLeagueIdFromContext", () => {
  const baseClub = { leagueId: "league-current" };

  it("retourne Club.leagueId quand seasonLeagues est undefined", () => {
    expect(
      resolveJerseyLeagueIdFromContext({
        season: "2010-11",
        club: { ...baseClub },
      })
    ).toBe("league-current");
  });

  it("retourne Club.leagueId quand seasonLeagues est vide", () => {
    expect(
      resolveJerseyLeagueIdFromContext({
        season: "2010-11",
        club: { ...baseClub, seasonLeagues: [] },
      })
    ).toBe("league-current");
  });

  it("retourne Club.leagueId quand aucune entrée ne matche la saison", () => {
    expect(
      resolveJerseyLeagueIdFromContext({
        season: "2010-11",
        club: {
          ...baseClub,
          seasonLeagues: [{ season: "2012-13", leagueId: "league-l2" }],
        },
      })
    ).toBe("league-current");
  });

  it("retourne l'entrée historique quand la saison matche", () => {
    expect(
      resolveJerseyLeagueIdFromContext({
        season: "2010-11",
        club: {
          ...baseClub,
          seasonLeagues: [
            { season: "2010-11", leagueId: "league-l2" },
            { season: "2012-13", leagueId: "league-l1" },
          ],
        },
      })
    ).toBe("league-l2");
  });

  it("retourne la première entrée si plusieurs matchent (defensive)", () => {
    expect(
      resolveJerseyLeagueIdFromContext({
        season: "2010-11",
        club: {
          ...baseClub,
          seasonLeagues: [
            { season: "2010-11", leagueId: "league-l2" },
            { season: "2010-11", leagueId: "league-other" },
          ],
        },
      })
    ).toBe("league-l2");
  });
});
