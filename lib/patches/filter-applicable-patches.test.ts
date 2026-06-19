import { describe, it, expect } from "vitest";
import type { Patch, PatchVersion, Jersey, Club, League } from "@prisma/client";
import { filterApplicablePatches } from "./filter-applicable-patches";

type PatchWithVersions = Patch & { versions: PatchVersion[] };
type JerseyContext = Jersey & { club: Club & { league: League } };

function filterWithCurrentLeague(
  patches: PatchWithVersions[],
  jersey: JerseyContext
) {
  return filterApplicablePatches(patches, jersey, jersey.club.leagueId);
}

function makePatch(overrides: Partial<PatchWithVersions> = {}): PatchWithVersions {
  return {
    id: "p1",
    name: "Test Patch",
    family: "UEFA_COMPETITION",
    leagueId: null,
    isActive: true,
    notes: null,
    eligibleClubIds: [],
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
    mainColor: null,
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
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
    expect(result[0].patch.id).toBe("p1");
  });

  it("2. Club CONMEBOL ne voit pas un patch UEFA_COMPETITION", () => {
    const jersey = makeJersey("brasileirao");
    const patch = makePatch({ family: "UEFA_COMPETITION" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("3. Club CONMEBOL voit un patch CONFED_CLUB_COMPETITION", () => {
    const jersey = makeJersey("brasileirao");
    const patch = makePatch({ family: "CONFED_CLUB_COMPETITION" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("4. Club UEFA ne voit pas un patch CONFED_CLUB_COMPETITION", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "CONFED_CLUB_COMPETITION" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("5. DOMESTIC_LEAGUE_BADGE visible si leagueId match", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "DOMESTIC_LEAGUE_BADGE", leagueId: "ligue-1" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("6. DOMESTIC_LEAGUE_BADGE invisible si autre leagueId", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "DOMESTIC_LEAGUE_BADGE", leagueId: "serie-a" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("7. Selection nationale voit un patch NATIONAL_TEAM_COMPETITION", () => {
    const jersey = makeJersey("uefa");
    const patch = makePatch({ family: "NATIONAL_TEAM_COMPETITION" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("8. Club non national ne voit pas un patch NATIONAL_TEAM_COMPETITION", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "NATIONAL_TEAM_COMPETITION" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("9. Selection nationale ne voit pas un patch UEFA_COMPETITION", () => {
    const jersey = makeJersey("uefa");
    const patch = makePatch({ family: "UEFA_COMPETITION" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("10. Saison dans la fenetre retourne la version", () => {
    const jersey = makeJersey("ligue-1", "2022-23");
    const v1 = makeVersion({ seasonStart: "2020-21", seasonEnd: "2023-24" });
    const patch = makePatch({ versions: [v1] });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result[0].activeVersion?.id).toBe("v1");
  });

  it("11. Saison hors toutes les fenetres retourne activeVersion=null", () => {
    const jersey = makeJersey("ligue-1", "2019-20");
    const v1 = makeVersion({ seasonStart: "2020-21", seasonEnd: "2023-24" });
    const patch = makePatch({ versions: [v1] });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result[0].activeVersion).toBeNull();
  });

  it("12. Patch isActive=false est exclu", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ isActive: false });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("13. FIFA_CLUB_COMPETITION visible pour tout club non national", () => {
    const jerseyUEFA = makeJersey("ligue-1");
    const jerseyCONMEBOL = makeJersey("brasileirao");
    const patch = makePatch({ family: "FIFA_CLUB_COMPETITION" });
    expect(filterWithCurrentLeague([patch], jerseyUEFA)).toHaveLength(1);
    expect(filterWithCurrentLeague([patch], jerseyCONMEBOL)).toHaveLength(1);
  });

  it("14. FIFA_CLUB_COMPETITION invisible pour selection nationale", () => {
    const jersey = makeJersey("uefa");
    const patch = makePatch({ family: "FIFA_CLUB_COMPETITION" });
    expect(filterWithCurrentLeague([patch], jersey)).toHaveLength(0);
  });

  it("15. CUSTOM est toujours exclu du catalogue applicable", () => {
    const jersey = makeJersey("ligue-1");
    const patch = makePatch({ family: "CUSTOM", name: "Centenaire club" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("16. Selectionne la bonne version parmi plusieurs", () => {
    const jersey = makeJersey("ligue-1", "2022-23");
    const v1 = makeVersion({ id: "v1", seasonStart: "2017-18", seasonEnd: "2020-21" });
    const v2 = makeVersion({ id: "v2", seasonStart: "2021-22", seasonEnd: "2023-24" });
    const v3 = makeVersion({ id: "v3", seasonStart: "2024-25", seasonEnd: null });
    const patch = makePatch({ versions: [v1, v2, v3] });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result[0].activeVersion?.id).toBe("v2");
  });

  it("17a. Patch national en année matche un maillot national sur la même année", () => {
    const jersey = makeJersey("uefa", "2024");
    const v1 = makeVersion({ seasonStart: "2024", seasonEnd: "2024" });
    const patch = makePatch({ family: "NATIONAL_TEAM_COMPETITION", versions: [v1] });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result[0].activeVersion?.id).toBe("v1");
  });

  it("17b. Patch national en plage d'années couvre les années intermédiaires", () => {
    const jersey = makeJersey("uefa", "2025");
    const v1 = makeVersion({ seasonStart: "2024", seasonEnd: "2026" });
    const patch = makePatch({ family: "NATIONAL_TEAM_COMPETITION", versions: [v1] });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result[0].activeVersion?.id).toBe("v1");
  });

  it("17c. Maillot national antérieur au start n'a pas de version active", () => {
    const jersey = makeJersey("uefa", "2023");
    const v1 = makeVersion({ seasonStart: "2024", seasonEnd: "2024" });
    const patch = makePatch({ family: "NATIONAL_TEAM_COMPETITION", versions: [v1] });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
    expect(result[0].activeVersion).toBeNull();
  });

  it("17g. Patch national UEFA visible pour sélection UEFA", () => {
    const jersey = makeJersey("uefa", "2024");
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      leagueId: "uefa",
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("17h. Patch national UEFA invisible pour sélection CONMEBOL", () => {
    const jersey = makeJersey("conmebol", "2024");
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      leagueId: "uefa",
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("17i. Patch national sans leagueId (FIFA) visible pour toutes les sélections", () => {
    const jerseyUefa = makeJersey("uefa", "2026");
    const jerseyConmebol = makeJersey("conmebol", "2026");
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      leagueId: null,
    });
    expect(filterWithCurrentLeague([patch], jerseyUefa)).toHaveLength(1);
    expect(filterWithCurrentLeague([patch], jerseyConmebol)).toHaveLength(1);
  });

  it("17d. eligibleClubIds vide laisse le patch applicable (régression)", () => {
    const jersey = makeJersey("uefa", "2024");
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: [],
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("17e. eligibleClubIds inclut le clubId du maillot, applicable", () => {
    const jersey = makeJersey("uefa", "2024");
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: ["c1"],
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("17f. eligibleClubIds n'inclut pas le clubId du maillot, non applicable", () => {
    const jersey = makeJersey("uefa", "2024");
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: ["c-other"],
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("18. resolvedLeagueId force la ligue historique pour DOMESTIC_LEAGUE_BADGE", () => {
    const jersey = makeJersey("ligue-1", "2010-11");
    const patchL1 = makePatch({
      id: "p-l1",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "ligue-1",
    });
    const patchL2 = makePatch({
      id: "p-l2",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "ligue-2",
    });

    const resultDefault = filterWithCurrentLeague([patchL1, patchL2], jersey);
    expect(resultDefault.map((r) => r.patch.id)).toEqual(["p-l1"]);

    const resultHistorical = filterApplicablePatches(
      [patchL1, patchL2],
      jersey,
      "ligue-2"
    );
    expect(resultHistorical.map((r) => r.patch.id)).toEqual(["p-l2"]);
  });
});
