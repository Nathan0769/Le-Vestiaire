import { describe, it, expect } from "vitest";
import type { Patch, PatchVersion, Jersey, Club, League } from "@prisma/client";
import { filterApplicablePatches } from "./filter-applicable-patches";

type PatchWithVersions = Patch & { versions: PatchVersion[] };
type JerseyContext = Jersey & { club: Club & { league: League } };

function makePatch(overrides: Partial<PatchWithVersions> = {}): PatchWithVersions {
  return {
    id: "p1",
    name: "Test Patch",
    family: "UEFA_COMPETITION",
    leagueId: null,
    isActive: true,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    versions: [],
    ...overrides,
  };
}

function makeVersion(overrides: Partial<PatchVersion> = {}): PatchVersion {
  return {
    id: "v1",
    patchId: "p1",
    seasonStart: "2020-21",
    seasonEnd: null,
    imageUrl: "https://r2.example.com/v1.png",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeJersey(leagueId: string, season = "2024-25"): JerseyContext {
  return {
    id: "j1",
    name: "Test Jersey",
    clubId: "c1",
    season,
    type: "HOME",
    brand: "Nike",
    imageUrl: "",
    retailPrice: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    slug: null,
    descriptionTranslations: null,
    variant: 1,
    club: {
      id: "c1",
      name: "Test Club",
      shortName: "TC",
      leagueId,
      logoUrl: "",
      primaryColor: "#000",
      apiFootballTeamId: null,
      slug: null,
      league: {
        id: leagueId,
        name: leagueId,
        country: "",
        logoUrl: "",
        tier: 1,
        logoDarkUrl: null,
      } as League,
    } as Club & { league: League },
  };
}

describe("filterApplicablePatches", () => {
  it("1. Club UEFA voit un patch UEFA_COMPETITION", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "UEFA_COMPETITION" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(1);
    expect(result[0].patch.id).toBe("p1");
  });

  it("2. Club CONMEBOL ne voit pas un patch UEFA_COMPETITION", () => {
    const jersey = makeJersey("brasileirao");
    const patch = makePatch({ family: "UEFA_COMPETITION" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("3. Club CONMEBOL voit un patch CONFED_CLUB_COMPETITION", () => {
    const jersey = makeJersey("brasileirao");
    const patch = makePatch({ family: "CONFED_CLUB_COMPETITION" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("4. Club UEFA ne voit pas un patch CONFED_CLUB_COMPETITION", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "CONFED_CLUB_COMPETITION" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("5. DOMESTIC_LEAGUE_BADGE visible si leagueId match", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "DOMESTIC_LEAGUE_BADGE", leagueId: "ligue-1" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("6. DOMESTIC_LEAGUE_BADGE invisible si autre leagueId", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "DOMESTIC_LEAGUE_BADGE", leagueId: "serie-a" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("7. Selection nationale voit un patch NATIONAL_TEAM_COMPETITION", () => {
    const jersey = makeJersey("national");
    const patch = makePatch({ family: "NATIONAL_TEAM_COMPETITION" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("8. Club non national ne voit pas un patch NATIONAL_TEAM_COMPETITION", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "NATIONAL_TEAM_COMPETITION" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("9. Selection nationale ne voit pas un patch UEFA_COMPETITION", () => {
    const jersey = makeJersey("national");
    const patch = makePatch({ family: "UEFA_COMPETITION" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("10. Saison dans la fenetre retourne la version", () => {
    const jersey = makeJersey("ligue-1", "2022-23");
    const v1 = makeVersion({ seasonStart: "2020-21", seasonEnd: "2023-24" });
    const patch = makePatch({ versions: [v1] });
    const result = filterApplicablePatches([patch], jersey);
    expect(result[0].activeVersion?.id).toBe("v1");
  });

  it("11. Saison hors toutes les fenetres retourne activeVersion=null", () => {
    const jersey = makeJersey("ligue-1", "2019-20");
    const v1 = makeVersion({ seasonStart: "2020-21", seasonEnd: "2023-24" });
    const patch = makePatch({ versions: [v1] });
    const result = filterApplicablePatches([patch], jersey);
    expect(result[0].activeVersion).toBeNull();
  });

  it("12. Patch isActive=false est exclu", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ isActive: false });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("13. FIFA_CLUB_COMPETITION visible pour tout club non national", () => {
    const jerseyUEFA = makeJersey("ligue-1");
    const jerseyCONMEBOL = makeJersey("brasileirao");
    const patch = makePatch({ family: "FIFA_CLUB_COMPETITION" });
    expect(filterApplicablePatches([patch], jerseyUEFA)).toHaveLength(1);
    expect(filterApplicablePatches([patch], jerseyCONMEBOL)).toHaveLength(1);
  });

  it("14. FIFA_CLUB_COMPETITION invisible pour selection nationale", () => {
    const jersey = makeJersey("national");
    const patch = makePatch({ family: "FIFA_CLUB_COMPETITION" });
    expect(filterApplicablePatches([patch], jersey)).toHaveLength(0);
  });

  it("15. CUSTOM est toujours exclu du catalogue applicable", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "CUSTOM", name: "Centenaire club" });
    const result = filterApplicablePatches([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("16. Selectionne la bonne version parmi plusieurs", () => {
    const jersey = makeJersey("ligue-1", "2022-23");
    const v1 = makeVersion({ id: "v1", seasonStart: "2017-18", seasonEnd: "2020-21" });
    const v2 = makeVersion({ id: "v2", seasonStart: "2021-22", seasonEnd: "2023-24" });
    const v3 = makeVersion({ id: "v3", seasonStart: "2024-25", seasonEnd: null });
    const patch = makePatch({ versions: [v1, v2, v3] });
    const result = filterApplicablePatches([patch], jersey);
    expect(result[0].activeVersion?.id).toBe("v2");
  });
});
