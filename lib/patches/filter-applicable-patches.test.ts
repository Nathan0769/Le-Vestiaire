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
    variant: null,
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
    eligibleClubIds: [],
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
    const jersey = makeJersey("brasileiro-serie-a");
    const patch = makePatch({ family: "UEFA_COMPETITION" });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("3. Club CONMEBOL voit un patch CONFED_CLUB_COMPETITION", () => {
    const jersey = makeJersey("brasileiro-serie-a");
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
    const patch = makePatch({ family: "DOMESTIC_LEAGUE_BADGE", leagueId: "ligue-1", versions: [v1] });
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
    const jerseyCONMEBOL = makeJersey("brasileiro-serie-a");
    const patch = makePatch({ family: "FIFA_CLUB_COMPETITION" });
    expect(filterWithCurrentLeague([patch], jerseyUEFA)).toHaveLength(1);
    expect(filterWithCurrentLeague([patch], jerseyCONMEBOL)).toHaveLength(1);
  });

  it("14. FIFA_CLUB_COMPETITION invisible pour selection nationale", () => {
    const jersey = makeJersey("uefa");
    const patch = makePatch({ family: "FIFA_CLUB_COMPETITION" });
    expect(filterWithCurrentLeague([patch], jersey)).toHaveLength(0);
  });

  it("15. CUSTOM sans liste de clubs est exclu du catalogue applicable", () => {
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

  it("17j. version.eligibleClubIds override le patch.eligibleClubIds (inclut le club)", () => {
    const jersey = makeJersey("uefa", "2024");
    const v1 = makeVersion({ seasonStart: "2024", seasonEnd: "2024", eligibleClubIds: ["c1"] });
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: ["c-other"],
      versions: [v1],
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("17k. version.eligibleClubIds override le patch.eligibleClubIds (exclut le club)", () => {
    const jersey = makeJersey("uefa", "2024");
    const v1 = makeVersion({ seasonStart: "2024", seasonEnd: "2024", eligibleClubIds: ["c-other"] });
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: ["c1"],
      versions: [v1],
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(0);
  });

  it("17l. version.eligibleClubIds vide retombe sur patch.eligibleClubIds", () => {
    const jersey = makeJersey("uefa", "2024");
    const v1 = makeVersion({ seasonStart: "2024", seasonEnd: "2024", eligibleClubIds: [] });
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: ["c1"],
      versions: [v1],
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
  });

  it("17m. version.eligibleClubIds ignore si pas de version active (fallback patch)", () => {
    const jersey = makeJersey("uefa", "2019");
    const v1 = makeVersion({ seasonStart: "2024", seasonEnd: "2024", eligibleClubIds: ["c-other"] });
    const patch = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: ["c1"],
      versions: [v1],
    });
    const result = filterWithCurrentLeague([patch], jersey);
    expect(result).toHaveLength(1);
    expect(result[0].activeVersion).toBeNull();
  });

  it("19a. Ligue 1: champion en titre sur la saison retire le badge de ligue normal", () => {
    const jersey = makeJersey("ligue-1", "2024-25");
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "ligue-1",
      versions: [
        makeVersion({
          id: "cv",
          seasonStart: "2024-25",
          seasonEnd: "2024-25",
          eligibleClubIds: ["c1"],
        }),
      ],
    });
    const badge = makePatch({
      id: "p-badge",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "ligue-1",
    });
    const result = filterWithCurrentLeague([champion, badge], jersey);
    expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
  });

  it("19b. Bundesliga et Premier League: même substitution champion → badge", () => {
    for (const leagueId of ["bundesliga", "premier-league"]) {
      const jersey = makeJersey(leagueId, "2024-25");
      const champion = makePatch({
        id: "p-champ",
        family: "DOMESTIC_CHAMPION",
        leagueId,
        versions: [
          makeVersion({
            id: "cv",
            seasonStart: "2024-25",
            seasonEnd: "2024-25",
            eligibleClubIds: ["c1"],
          }),
        ],
      });
      const badge = makePatch({
        id: "p-badge",
        family: "DOMESTIC_LEAGUE_BADGE",
        leagueId,
      });
      const result = filterWithCurrentLeague([champion, badge], jersey);
      expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
    }
  });

  it("19c. Ligue 1: club non champion (version l'exclut) garde le badge de ligue", () => {
    const jersey = makeJersey("ligue-1", "2024-25");
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "ligue-1",
      versions: [
        makeVersion({
          id: "cv",
          seasonStart: "2024-25",
          seasonEnd: "2024-25",
          eligibleClubIds: ["c-other"],
        }),
      ],
    });
    const badge = makePatch({
      id: "p-badge",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "ligue-1",
    });
    const result = filterWithCurrentLeague([champion, badge], jersey);
    expect(result.map((r) => r.patch.id)).toEqual(["p-badge"]);
  });

  it("19d. Ligue 1: champion sans version couvrant la saison garde le badge de ligue", () => {
    const jersey = makeJersey("ligue-1", "2024-25");
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "ligue-1",
      versions: [
        makeVersion({ id: "cv", seasonStart: "2022-23", seasonEnd: "2022-23" }),
      ],
    });
    const badge = makePatch({
      id: "p-badge",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "ligue-1",
    });
    const result = filterWithCurrentLeague([champion, badge], jersey);
    expect(result.map((r) => r.patch.id).sort()).toEqual(["p-badge", "p-champ"]);
  });

  it("19e. Serie A (hors périmètre): champion et badge de ligue coexistent", () => {
    const jersey = makeJersey("serie-a", "2024-25");
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "serie-a",
      versions: [
        makeVersion({
          id: "cv",
          seasonStart: "2024-25",
          seasonEnd: "2024-25",
          eligibleClubIds: ["c1"],
        }),
      ],
    });
    const badge = makePatch({
      id: "p-badge",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "serie-a",
    });
    const result = filterWithCurrentLeague([champion, badge], jersey);
    expect(result.map((r) => r.patch.id).sort()).toEqual(["p-badge", "p-champ"]);
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

  it("19. Badge of Honour prime le starball (précédence LDC)", () => {
    const jersey = makeJersey("ligue-1", "2024-25");
    const starball = makePatch({
      id: "p-sb",
      family: "UEFA_COMPETITION",
      variant: "UEFA_STARBALL",
    });
    const honour = makePatch({
      id: "p-ho",
      family: "UEFA_COMPETITION",
      variant: "UEFA_BADGE_OF_HONOUR",
      eligibleClubIds: ["c1"],
      versions: [makeVersion({ id: "vho", seasonStart: "2024-25" })],
    });
    const result = filterWithCurrentLeague([starball, honour], jersey);
    expect(result.map((r) => r.patch.id)).toEqual(["p-ho"]);
  });

  it("20. Badge of Honour sans version couvrant la saison retombe sur le starball", () => {
    const jersey = makeJersey("ligue-1", "2024-25");
    const starball = makePatch({
      id: "p-sb",
      family: "UEFA_COMPETITION",
      variant: "UEFA_STARBALL",
    });
    const honour = makePatch({
      id: "p-ho",
      family: "UEFA_COMPETITION",
      variant: "UEFA_BADGE_OF_HONOUR",
      eligibleClubIds: ["c1"],
      versions: [makeVersion({ id: "vho", seasonStart: "2018-19", seasonEnd: "2020-21" })],
    });
    const result = filterWithCurrentLeague([starball, honour], jersey);
    expect(result.map((r) => r.patch.id)).toEqual(["p-sb"]);
  });

  it("21. Tenant du titre prime le honour et le starball", () => {
    const jersey = makeJersey("ligue-1", "2024-25");
    const starball = makePatch({
      id: "p-sb",
      family: "UEFA_COMPETITION",
      variant: "UEFA_STARBALL",
    });
    const honour = makePatch({
      id: "p-ho",
      family: "UEFA_COMPETITION",
      variant: "UEFA_BADGE_OF_HONOUR",
      eligibleClubIds: ["c1"],
      versions: [makeVersion({ id: "vho", seasonStart: "2024-25" })],
    });
    const titleHolder = makePatch({
      id: "p-th",
      family: "UEFA_COMPETITION",
      variant: "UEFA_TITLE_HOLDER",
      versions: [
        makeVersion({ id: "vth", seasonStart: "2024-25", eligibleClubIds: ["c1"] }),
      ],
    });
    const result = filterWithCurrentLeague([starball, honour, titleHolder], jersey);
    expect(result.map((r) => r.patch.id)).toEqual(["p-th"]);
  });

  it("22. Un patch UEFA legacy (variant null) n'est pas collapsé", () => {
    const jersey = makeJersey("ligue-1", "2024-25");
    const legacy = makePatch({
      id: "p-legacy",
      family: "UEFA_COMPETITION",
      variant: null,
    });
    const starball = makePatch({
      id: "p-sb",
      family: "UEFA_COMPETITION",
      variant: "UEFA_STARBALL",
    });
    const result = filterWithCurrentLeague([legacy, starball], jersey);
    expect(result.map((r) => r.patch.id).sort()).toEqual(["p-legacy", "p-sb"]);
  });
});

describe("filterApplicablePatches - MLS", () => {
  function mlsJersey(season: string, clubId = "c1"): JerseyContext {
    return { ...makeJersey("mls", season), clubId };
  }

  it("MLS : une version par club, le maillot reçoit la version de son club", () => {
    const badge = makePatch({
      id: "p-mls",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "mls",
      versions: [
        makeVersion({ id: "v-c1", seasonStart: "2023", eligibleClubIds: ["c1"] }),
        makeVersion({ id: "v-c2", seasonStart: "2023", eligibleClubIds: ["c2"] }),
      ],
    });
    const result = filterWithCurrentLeague([badge], mlsJersey("2024", "c2"));
    expect(result[0]?.activeVersion?.id).toBe("v-c2");
  });

  it("MLS : patch sans version active non proposé", () => {
    const badge = makePatch({
      id: "p-mls",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "mls",
      versions: [
        makeVersion({ seasonStart: "1996", seasonEnd: "2014", eligibleClubIds: ["c1"] }),
      ],
    });
    expect(filterWithCurrentLeague([badge], mlsJersey("1980"))).toHaveLength(0);
  });

  it("MLS : Champion MLS non proposé à un autre club", () => {
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "mls",
      versions: [
        makeVersion({ seasonStart: "2025", seasonEnd: "2025", eligibleClubIds: ["la-galaxy"] }),
      ],
    });
    expect(filterWithCurrentLeague([champion], mlsJersey("2025"))).toHaveLength(0);
  });

  it("MLS : le champion en titre remplace le badge MLS", () => {
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "mls",
      versions: [
        makeVersion({ id: "cv", seasonStart: "2025", seasonEnd: "2025", eligibleClubIds: ["c1"] }),
      ],
    });
    const badge = makePatch({
      id: "p-mls",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "mls",
      versions: [
        makeVersion({ id: "bv", seasonStart: "2023", eligibleClubIds: ["c1"] }),
      ],
    });
    const result = filterWithCurrentLeague([champion, badge], mlsJersey("2025"));
    expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
  });

  it("Hors MLS : patch sans version active toujours proposé", () => {
    const badge = makePatch({
      id: "p-l1",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "ligue-1",
      versions: [makeVersion({ seasonStart: "2030-31" })],
    });
    const result = filterWithCurrentLeague([badge], makeJersey("ligue-1", "2024-25"));
    expect(result).toHaveLength(1);
    expect(result[0].activeVersion).toBeNull();
  });
});

describe("filterApplicablePatches - compétitions UEFA par saison", () => {
  it("UEFA : patch versionné sans version pour la saison non proposé", () => {
    const starball = makePatch({
      id: "p-sb",
      family: "UEFA_COMPETITION",
      variant: "UEFA_STARBALL",
      versions: [makeVersion({ seasonStart: "1992-93", seasonEnd: "1992-93", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([starball], makeJersey("ligue-1", "1990-91"))).toHaveLength(0);
  });

  it("UEFA : patch sans aucune version toujours proposé", () => {
    const patch = makePatch({ id: "p-new", family: "UEFA_COMPETITION" });
    expect(filterWithCurrentLeague([patch], makeJersey("ligue-1", "1990-91"))).toHaveLength(1);
  });
});

describe("filterApplicablePatches - J1", () => {
  it("J1 : le champion en titre remplace le badge de ligue", () => {
    const jersey = makeJersey("j1-league", "2025");
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "j1-league",
      versions: [
        makeVersion({ seasonStart: "2025", seasonEnd: "2025", eligibleClubIds: ["c1"] }),
      ],
    });
    const badge = makePatch({
      id: "p-badge",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "j1-league",
      versions: [makeVersion({ seasonStart: "2019" })],
    });
    const result = filterWithCurrentLeague([champion, badge], jersey);
    expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
  });
});

describe("filterApplicablePatches - patchs propres à un club (CUSTOM)", () => {
  it("CUSTOM : proposé au club cité dans la liste du patch", () => {
    const patch = makePatch({ id: "p-club", family: "CUSTOM", eligibleClubIds: ["c1"] });
    const result = filterWithCurrentLeague([patch], makeJersey("liga-mx"));
    expect(result.map((r) => r.patch.id)).toEqual(["p-club"]);
  });

  it("CUSTOM : non proposé à un autre club", () => {
    const patch = makePatch({ id: "p-club", family: "CUSTOM", eligibleClubIds: ["c2"] });
    expect(filterWithCurrentLeague([patch], makeJersey("liga-mx"))).toHaveLength(0);
  });

  it("CUSTOM : sans liste de clubs, reste caché", () => {
    const patch = makePatch({ id: "p-club", family: "CUSTOM", eligibleClubIds: [] });
    expect(filterWithCurrentLeague([patch], makeJersey("liga-mx"))).toHaveLength(0);
  });

  it("CUSTOM : la liste de la version active suffit", () => {
    const patch = makePatch({
      id: "p-club",
      family: "CUSTOM",
      versions: [makeVersion({ seasonStart: "2024-25", eligibleClubIds: ["c1"] })],
    });
    const result = filterWithCurrentLeague([patch], makeJersey("liga-mx", "2025-26"));
    expect(result[0]?.activeVersion?.id).toBe("v1");
  });

  it("CUSTOM : proposé quelle que soit la ligue du maillot", () => {
    const patch = makePatch({ id: "p-club", family: "CUSTOM", eligibleClubIds: ["c1"] });
    expect(filterWithCurrentLeague([patch], makeJersey("ligue-1"))).toHaveLength(1);
  });
});

describe("filterApplicablePatches - Liga MX", () => {
  it("Liga MX : le champion en titre remplace le badge de ligue", () => {
    const jersey = makeJersey("liga-mx", "2025-26");
    const champion = makePatch({
      id: "p-champ",
      family: "DOMESTIC_CHAMPION",
      leagueId: "liga-mx",
      versions: [
        makeVersion({ seasonStart: "2025-26", seasonEnd: "2025-26", eligibleClubIds: ["c1"] }),
      ],
    });
    const badge = makePatch({
      id: "p-badge",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "liga-mx",
      versions: [makeVersion({ seasonStart: "2019-20" })],
    });
    const result = filterWithCurrentLeague([champion, badge], jersey);
    expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
  });
});

describe("filterApplicablePatches - coupes nationales sur toutes les ligues du pays", () => {
  const COUNTRIES = new Map([
    ["liga-portugal", "Portugal"],
    ["liga-portugal-2", "Portugal"],
    ["la-liga", "Espagne"],
    ["cmq9sh0qf0000msdlbfyvp77u", "Autres"],
  ]);

  it("Coupe : proposée à un club d'une autre ligue du même pays", () => {
    const jersey = makeJersey("liga-portugal-2");
    const cup = makePatch({ family: "DOMESTIC_CUP", leagueId: "liga-portugal" });
    const result = filterApplicablePatches([cup], jersey, "liga-portugal-2", COUNTRIES);
    expect(result).toHaveLength(1);
  });

  it("Supercoupe : proposée à un club d'une autre ligue du même pays", () => {
    const jersey = makeJersey("liga-portugal-2");
    const supercup = makePatch({ family: "DOMESTIC_SUPERCUP", leagueId: "liga-portugal" });
    const result = filterApplicablePatches([supercup], jersey, "liga-portugal-2", COUNTRIES);
    expect(result).toHaveLength(1);
  });

  it("Coupe : non proposée à un club d'un autre pays", () => {
    const jersey = makeJersey("la-liga");
    const cup = makePatch({ family: "DOMESTIC_CUP", leagueId: "liga-portugal" });
    const result = filterApplicablePatches([cup], jersey, "la-liga", COUNTRIES);
    expect(result).toHaveLength(0);
  });

  it("Badge de ligue : reste réservé à sa ligue", () => {
    const jersey = makeJersey("liga-portugal-2");
    const badge = makePatch({ family: "DOMESTIC_LEAGUE_BADGE", leagueId: "liga-portugal" });
    const result = filterApplicablePatches([badge], jersey, "liga-portugal-2", COUNTRIES);
    expect(result).toHaveLength(0);
  });
});

describe("filterApplicablePatches - Liga Portugal (champion et Supertaça par saison)", () => {
  it("Champion versionné : non proposé sur une saison sans version", () => {
    const jersey = makeJersey("liga-portugal", "2005-06");
    const champion = makePatch({
      family: "DOMESTIC_CHAMPION",
      leagueId: "liga-portugal",
      versions: [makeVersion({ seasonStart: "2013-14", seasonEnd: "2013-14", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([champion], jersey)).toHaveLength(0);
  });

  it("Supertaça versionnée : non proposée sur une saison sans version", () => {
    const jersey = makeJersey("liga-portugal", "2005-06");
    const supercup = makePatch({
      family: "DOMESTIC_SUPERCUP",
      leagueId: "liga-portugal",
      versions: [makeVersion({ seasonStart: "2015-16", seasonEnd: "2015-16", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([supercup], jersey)).toHaveLength(0);
  });

  it("Badge de ligue : toujours proposé hors des périodes versionnées", () => {
    const jersey = makeJersey("liga-portugal", "2005-06");
    const badge = makePatch({
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "liga-portugal",
      versions: [makeVersion({ seasonStart: "2010-11", seasonEnd: "2013-14" })],
    });
    expect(filterWithCurrentLeague([badge], jersey)).toHaveLength(1);
  });
});

describe("filterApplicablePatches - Eredivisie (champion et Johan Cruijff Schaal par saison)", () => {
  it("Champion versionné : non proposé en 2020-21, titre 2019-20 non attribué", () => {
    const jersey = makeJersey("eredivisie", "2020-21");
    const champion = makePatch({
      family: "DOMESTIC_CHAMPION",
      leagueId: "eredivisie",
      versions: [
        makeVersion({ seasonStart: "2019-20", seasonEnd: "2019-20", eligibleClubIds: ["c1"] }),
        makeVersion({ seasonStart: "2021-22", seasonEnd: "2021-22", eligibleClubIds: ["c1"] }),
      ],
    });
    expect(filterWithCurrentLeague([champion], jersey)).toHaveLength(0);
  });

  it("Schaal versionnée : non proposée sur une saison sans version", () => {
    const jersey = makeJersey("eredivisie", "2020-21");
    const supercup = makePatch({
      family: "DOMESTIC_SUPERCUP",
      leagueId: "eredivisie",
      versions: [makeVersion({ seasonStart: "2019-20", seasonEnd: "2019-20", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([supercup], jersey)).toHaveLength(0);
  });
});

describe("filterApplicablePatches - Jupiler Pro League (champion et Supercoupe par saison)", () => {
  it("Champion versionné : non proposé avant le badge 2020", () => {
    const jersey = makeJersey("jupiler-pro-league", "2018-19");
    const champion = makePatch({
      family: "DOMESTIC_CHAMPION",
      leagueId: "jupiler-pro-league",
      versions: [makeVersion({ seasonStart: "2020-21", seasonEnd: "2020-21", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([champion], jersey)).toHaveLength(0);
  });

  it("Supercoupe versionnée : non proposée sur une saison sans version", () => {
    const jersey = makeJersey("jupiler-pro-league", "2020-21");
    const supercup = makePatch({
      family: "DOMESTIC_SUPERCUP",
      leagueId: "jupiler-pro-league",
      versions: [makeVersion({ seasonStart: "2021-22", seasonEnd: "2021-22", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([supercup], jersey)).toHaveLength(0);
  });
});

describe("filterApplicablePatches - badge champion à la place du badge de ligue (Europe)", () => {
  it.each(["liga-portugal", "eredivisie", "jupiler-pro-league", "scottish-premiership"])(
    "%s : le champion en titre remplace le badge de ligue",
    (leagueId) => {
      const jersey = makeJersey(leagueId, "2024-25");
      const champion = makePatch({
        id: "p-champ",
        family: "DOMESTIC_CHAMPION",
        leagueId,
        versions: [makeVersion({ seasonStart: "2024-25", seasonEnd: "2024-25", eligibleClubIds: ["c1"] })],
      });
      const badge = makePatch({
        id: "p-badge",
        family: "DOMESTIC_LEAGUE_BADGE",
        leagueId,
        versions: [makeVersion({ seasonStart: "2020-21" })],
      });
      const result = filterWithCurrentLeague([champion, badge], jersey);
      expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
    }
  );
});

describe("filterApplicablePatches - Scottish Premiership", () => {
  it("Champion versionné : non proposé en 2021-22, les Rangers refusaient le badge cinch", () => {
    const jersey = makeJersey("scottish-premiership", "2021-22");
    const champion = makePatch({
      family: "DOMESTIC_CHAMPION",
      leagueId: "scottish-premiership",
      versions: [
        makeVersion({ seasonStart: "2020-21", seasonEnd: "2020-21", eligibleClubIds: ["c1"] }),
        makeVersion({ seasonStart: "2022-23", seasonEnd: "2022-23", eligibleClubIds: ["c1"] }),
      ],
    });
    expect(filterWithCurrentLeague([champion], jersey)).toHaveLength(0);
  });

  it("Badge de ligue : un club exclu d'une version de la saison n'a pas le badge", () => {
    const jersey = makeJersey("scottish-premiership", "2022-23");
    const badge = makePatch({
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "scottish-premiership",
      versions: [makeVersion({ seasonStart: "2021-22", seasonEnd: "2023-24", eligibleClubIds: ["autre-club"] })],
    });
    expect(filterWithCurrentLeague([badge], jersey)).toHaveLength(0);
  });
});

describe("filterApplicablePatches - Copa Libertadores (participants par édition)", () => {
  const libertadores = (eligibleClubIds: string[]) =>
    makePatch({
      family: "CONFED_CLUB_COMPETITION",
      versions: [makeVersion({ seasonStart: "2019", seasonEnd: "2019", eligibleClubIds })],
    });

  it("Proposée à un club participant de l'édition", () => {
    const jersey = makeJersey("brasileiro-serie-a", "2019");
    expect(filterWithCurrentLeague([libertadores(["c1"])], jersey)).toHaveLength(1);
  });

  it("Non proposée à un club CONMEBOL absent de l'édition", () => {
    const jersey = makeJersey("brasileiro-serie-a", "2019");
    expect(filterWithCurrentLeague([libertadores(["autre-club"])], jersey)).toHaveLength(0);
  });

  it("Non proposée sur une saison sans édition versionnée", () => {
    const jersey = makeJersey("brasileiro-serie-a", "2010");
    expect(filterWithCurrentLeague([libertadores(["c1"])], jersey)).toHaveLength(0);
  });

  it("Non proposée à un club d'une autre confédération (MLS)", () => {
    const jersey = makeJersey("mls", "2019");
    expect(filterWithCurrentLeague([libertadores(["autre-club"])], jersey)).toHaveLength(0);
  });

  it("Patch continental sans liste de clubs : toujours proposé hors de ses versions", () => {
    const jersey = makeJersey("brasileiro-serie-a", "2010");
    const sudamericana = makePatch({
      family: "CONFED_CLUB_COMPETITION",
      versions: [makeVersion({ seasonStart: "2017-18" })],
    });
    expect(filterWithCurrentLeague([sudamericana], jersey)).toHaveLength(1);
  });
});

describe("filterApplicablePatches - patch continental réservé à sa confédération", () => {
  const confed = (name: string) => makePatch({ name, family: "CONFED_CLUB_COMPETITION" });

  it.each([
    ["Ligue des Champions CAF", "primera-division-argentina"],
    ["Coupe des Champions Concacaf", "brasileiro-serie-a"],
    ["Ligue des Champions AFC Elite", "liga-mx"],
    ["Copa Sudamericana", "saudi-pro-league"],
    ["Champion Copa Libertadores", "mls"],
    ["Champion Copa Sudamericana", "liga-mx"],
  ])("%s non proposé à un club de %s", (name, leagueId) => {
    expect(filterWithCurrentLeague([confed(name)], makeJersey(leagueId))).toHaveLength(0);
  });

  it.each([
    ["Copa Sudamericana", "primera-division-argentina"],
    ["Coupe des Champions Concacaf", "mls"],
    ["Ligue des Champions AFC Two", "j1-league"],
  ])("%s proposé à un club de %s", (name, leagueId) => {
    expect(filterWithCurrentLeague([confed(name)], makeJersey(leagueId))).toHaveLength(1);
  });

  it("Patch continental inconnu de la table : ouvert à toute confédération hors UEFA", () => {
    expect(filterWithCurrentLeague([confed("Nouveau patch")], makeJersey("mls"))).toHaveLength(1);
  });
});

describe("filterApplicablePatches - compétitions FIFA de clubs (participants par édition)", () => {
  const cwc = makePatch({
    family: "FIFA_CLUB_COMPETITION",
    versions: [makeVersion({ seasonStart: "2018-19", seasonEnd: "2018-19", eligibleClubIds: ["c1"] })],
  });

  it("Proposée à un participant de l'édition", () => {
    expect(filterWithCurrentLeague([cwc], makeJersey("la-liga", "2018-19"))).toHaveLength(1);
  });

  it("Non proposée sur une saison sans édition versionnée", () => {
    expect(filterWithCurrentLeague([cwc], makeJersey("la-liga", "2023-24"))).toHaveLength(0);
  });

  it("Patch FIFA sans liste de clubs : proposé hors de ses versions", () => {
    const open = makePatch({ family: "FIFA_CLUB_COMPETITION", versions: [makeVersion({ seasonStart: "2025-26" })] });
    expect(filterWithCurrentLeague([open], makeJersey("la-liga", "2023-24"))).toHaveLength(1);
  });
});

describe("filterApplicablePatches - compétition de sélections ouverte aux invités (Copa América)", () => {
  const copa = makePatch({
    family: "NATIONAL_TEAM_COMPETITION",
    leagueId: null,
    versions: [makeVersion({ seasonStart: "2015", seasonEnd: "2016", eligibleClubIds: ["c1"] })],
  });

  it("Proposée à une sélection invitée d'une autre confédération qui a joué l'édition", () => {
    expect(filterWithCurrentLeague([copa], makeJersey("concacaf", "2016"))).toHaveLength(1);
  });

  it("Non proposée sur une année sans édition", () => {
    expect(filterWithCurrentLeague([copa], makeJersey("uefa", "2022"))).toHaveLength(0);
  });

  it("Champion du Monde (liste de sélections sur le patch) reste proposé hors de ses versions", () => {
    const champion = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      leagueId: null,
      eligibleClubIds: ["c1"],
      versions: [makeVersion({ seasonStart: "2022", seasonEnd: "2026", eligibleClubIds: ["autre"] })],
    });
    expect(filterWithCurrentLeague([champion], makeJersey("uefa", "2018"))).toHaveLength(1);
  });
});

describe("filterApplicablePatches - compétition de sélections d'une confédération versionnée par édition", () => {
  it("Coupe d'Asie non proposée sur une année sans édition", () => {
    const asie = makePatch({
      family: "NATIONAL_TEAM_COMPETITION",
      leagueId: "afc",
      versions: [makeVersion({ seasonStart: "2023", seasonEnd: "2024", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([asie], makeJersey("afc", "2021"))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - patchs de campagne UEFA limités à leurs années", () => {
  const campaign = (name: string, seasonStart: string, seasonEnd: string | null) =>
    makePatch({ name, family: "NATIONAL_TEAM_COMPETITION", leagueId: "uefa", versions: [makeVersion({ seasonStart, seasonEnd })] });

  it.each([
    ["Ligue des Nations UEFA", "2018", null, "2010"],
    ["UEFA Foundation", "2021", null, "2016"],
    ["Respect UEFA", "2014", "2020", "2022"],
  ])("%s non proposé hors de ses années", (name, start, end, season) => {
    expect(filterWithCurrentLeague([campaign(name, start, end)], makeJersey("uefa", season))).toHaveLength(0);
  });

  it("Proposé sur une année couverte", () => {
    expect(filterWithCurrentLeague([campaign("Respect UEFA", "2014", "2020")], makeJersey("uefa", "2016"))).toHaveLength(1);
  });
});

describe("filterApplicablePatches - badge manche 2026 des anciens vainqueurs", () => {
  it("Non proposé à un ancien vainqueur hors de 2026", () => {
    const badge = makePatch({
      name: "Coupe du Monde FIFA champion clair",
      family: "NATIONAL_TEAM_COMPETITION",
      eligibleClubIds: ["c1"],
      versions: [makeVersion({ seasonStart: "2026", seasonEnd: "2026", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([badge], makeJersey("uefa", "2018"))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - coupes françaises", () => {
  it("Trophée des Champions non proposé sur une saison sans édition", () => {
    const tdc = makePatch({
      family: "DOMESTIC_SUPERCUP",
      leagueId: "ligue-1",
      versions: [makeVersion({ seasonStart: "2019-20", seasonEnd: "2019-20", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([tdc], makeJersey("ligue-1", "1996-97"))).toHaveLength(0);
  });

  it("Coupe de la Ligue non proposée après sa disparition", () => {
    const cdl = makePatch({
      name: "Coupe de la Ligue",
      family: "DOMESTIC_CUP",
      leagueId: "ligue-1",
      versions: [makeVersion({ seasonStart: "2017-18", seasonEnd: "2019-20" })],
    });
    expect(filterWithCurrentLeague([cdl], makeJersey("ligue-1", "2022-23"))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - Coupe de la Ligue réservée aux clubs pros", () => {
  const cdl = makePatch({
    name: "Coupe de la Ligue",
    family: "DOMESTIC_CUP",
    leagueId: "ligue-1",
    versions: [makeVersion({ seasonStart: "2017-18", seasonEnd: "2019-20" })],
  });
  const countries = new Map([["ligue-1", "France"], ["ligue-2", "France"], ["national", "France"]]);

  it("Proposée à un club de Ligue 2", () => {
    expect(filterApplicablePatches([cdl], makeJersey("ligue-2", "2018-19"), "ligue-2", countries)).toHaveLength(1);
  });

  it("Non proposée à un club de National", () => {
    expect(filterApplicablePatches([cdl], makeJersey("national", "2018-19"), "national", countries)).toHaveLength(0);
  });
});

describe("filterApplicablePatches - FA Community Shield réservé aux finalistes", () => {
  it("Non proposé sur une saison sans édition", () => {
    const shield = makePatch({
      family: "DOMESTIC_SUPERCUP",
      leagueId: "premier-league",
      versions: [makeVersion({ seasonStart: "2019-20", seasonEnd: "2019-20", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([shield], makeJersey("premier-league", "1990-91"))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - patch FA Cup du tenant du titre", () => {
  it("Non proposé au club hors de sa saison de tenant", () => {
    const holder = makePatch({
      name: "FA Cup - tenant du titre",
      family: "DOMESTIC_CUP",
      leagueId: "premier-league",
      versions: [makeVersion({ seasonStart: "2020-21", seasonEnd: "2020-21", eligibleClubIds: ["c1"] })],
    });
    expect(filterWithCurrentLeague([holder], makeJersey("premier-league", "2023-24"))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - EFL Cup", () => {
  it.each([
    ["EFL Cup", "2005-06"],
    ["EFL Cup - tenant du titre", "2023-24"],
  ])("%s non proposé hors de ses années (%s)", (name, season) => {
    const patch = makePatch({
      name,
      family: "DOMESTIC_CUP",
      leagueId: "premier-league",
      versions: [makeVersion({ seasonStart: "2025-26", seasonEnd: "2025-26", eligibleClubIds: name.includes("tenant") ? ["c1"] : [] })],
    });
    expect(filterWithCurrentLeague([patch], makeJersey("premier-league", season))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - patchs de campagne EFL", () => {
  it.each([
    ["Sky Bet - jeu responsable", "2016-17"],
    ["Not Today or Any Day", "2023-24"],
    ["EFL Together", "2019-20"],
  ])("%s non proposé hors de ses saisons (%s)", (name, season) => {
    const patch = makePatch({
      name,
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: "efl-championship",
      versions: [makeVersion({ seasonStart: "2021-22", seasonEnd: "2021-22" })],
    });
    expect(filterWithCurrentLeague([patch], makeJersey("efl-championship", season))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - Allsvenskan", () => {
  const champion = makePatch({
    id: "p-champ",
    family: "DOMESTIC_CHAMPION",
    leagueId: "allsvenskan",
    versions: [makeVersion({ seasonStart: "2024", seasonEnd: "2024", eligibleClubIds: ["c1"] })],
  });
  const badge = makePatch({
    id: "p-badge",
    family: "DOMESTIC_LEAGUE_BADGE",
    leagueId: "allsvenskan",
    versions: [makeVersion({ seasonStart: "2019", seasonEnd: null })],
  });

  it("Le champion en titre porte le badge doré à la place du badge de ligue", () => {
    const result = filterWithCurrentLeague([champion, badge], makeJersey("allsvenskan", "2024"));
    expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
  });

  it("Pas de badge champion avant 2021", () => {
    expect(filterWithCurrentLeague([champion], makeJersey("allsvenskan", "2019"))).toHaveLength(0);
  });
});

describe("filterApplicablePatches - Saudi Pro League", () => {
  const champion = makePatch({
    id: "p-champ",
    name: "Champion Roshn Saudi League",
    family: "DOMESTIC_CHAMPION",
    leagueId: "saudi-pro-league",
    versions: [makeVersion({ seasonStart: "2025-26", seasonEnd: "2025-26", eligibleClubIds: ["c1"] })],
  });
  const badge = makePatch({
    id: "p-badge",
    name: "Roshn Saudi League",
    family: "DOMESTIC_LEAGUE_BADGE",
    leagueId: "saudi-pro-league",
    versions: [makeVersion({ seasonStart: "2022-23", seasonEnd: null })],
  });

  it("Le champion en titre porte le badge doré à la place du badge de ligue", () => {
    const result = filterWithCurrentLeague([champion, badge], makeJersey("saudi-pro-league", "2025-26"));
    expect(result.map((r) => r.patch.id)).toEqual(["p-champ"]);
  });

  it("Pas de badge champion hors des saisons versionnées", () => {
    expect(filterWithCurrentLeague([champion], makeJersey("saudi-pro-league", "2023-24"))).toHaveLength(0);
  });

  it("Pas de badge Roshn avant le sponsoring (2022-23)", () => {
    expect(filterWithCurrentLeague([badge], makeJersey("saudi-pro-league", "2021-22"))).toHaveLength(0);
  });
});
