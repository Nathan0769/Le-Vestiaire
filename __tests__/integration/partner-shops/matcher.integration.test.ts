import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { loadClubIndex, resolvePartnerMatch } from "@/lib/partner-shops/matcher";
import type { ParsedPartnerTitle } from "@/lib/partner-shops/title-parser";
import { prismaTest } from "../../helpers/db";
import { createTestClub, createTestJersey, createTestLeague } from "../../helpers/fixtures";

const parsed = (over: Partial<ParsedPartnerTitle> = {}): ParsedPartnerTitle => ({
  club: "Étoile Zzvestiaire Test",
  season: "2022-23",
  type: "HOME",
  longSleeve: false,
  isJersey: true,
  ...over,
});

const TEST_SHOPS = ["test-shop", "autre-shop"];
const leagueIds: string[] = [];

// La base de dev est partagée : on ne supprime que ce que ces tests créent.
async function cleanup() {
  await prismaTest.partnerClubAlias.deleteMany({ where: { shop: { in: TEST_SHOPS } } });
  await prismaTest.jersey.deleteMany({ where: { club: { name: { startsWith: "Etoile Zzvestiaire" } } } });
  await prismaTest.club.deleteMany({ where: { name: { startsWith: "Etoile Zzvestiaire" } } });
  await prismaTest.league.deleteMany({ where: { id: { in: leagueIds } } });
  leagueIds.length = 0;
}

async function createClub(shortName: string) {
  const league = await createTestLeague();
  leagueIds.push(league.id);
  return createTestClub(league.id, { name: "Etoile Zzvestiaire Test", shortName });
}

describe("resolvePartnerMatch", () => {
  let clubId: string;
  let jerseyId: string;

  beforeAll(cleanup);
  afterEach(cleanup);

  beforeEach(async () => {
    const club = await createClub("Zzvest Crvena");
    const jersey = await createTestJersey(club.id, { season: "2022-23", type: "HOME" });
    clubId = club.id;
    jerseyId = jersey.id;
  });

  it("IGNORED pour un produit qui n'est pas un maillot", async () => {
    const r = await resolvePartnerMatch(parsed({ isJersey: false }), new Map());
    expect(r).toEqual({ jerseyId: null, matchStatus: "IGNORED" });
  });

  it("PARSE_FAILED sans saison", async () => {
    const r = await resolvePartnerMatch(parsed({ season: null }), new Map());
    expect(r.matchStatus).toBe("PARSE_FAILED");
  });

  it("PARSE_FAILED sans type", async () => {
    const r = await resolvePartnerMatch(parsed({ type: null }), new Map());
    expect(r.matchStatus).toBe("PARSE_FAILED");
  });

  it("MATCHED en retrouvant le club par son nom, accents compris", async () => {
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed(), index);
    expect(r).toEqual({ jerseyId, matchStatus: "MATCHED" });
  });

  it("MATCHED par le nom court du club", async () => {
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed({ club: "Zzvest Crvena" }), index);
    expect(r).toEqual({ jerseyId, matchStatus: "MATCHED" });
  });

  it("MATCHED par un alias de la boutique", async () => {
    await prismaTest.partnerClubAlias.create({
      data: { shop: "test-shop", externalName: "Zzvest Red Star", clubId },
    });
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed({ club: "Zzvest Red Star" }), index);
    expect(r).toEqual({ jerseyId, matchStatus: "MATCHED" });
  });

  it("n'utilise pas les alias d'une autre boutique", async () => {
    await prismaTest.partnerClubAlias.create({
      data: { shop: "autre-shop", externalName: "Zzvest Red Star", clubId },
    });
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed({ club: "Zzvest Red Star" }), index);
    expect(r.matchStatus).toBe("NEEDS_ALIAS");
  });

  it("NEEDS_ALIAS quand un nom est porté par deux clubs", async () => {
    await createClub("Zzvest ERB");
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed(), index);
    expect(r.matchStatus).toBe("NEEDS_ALIAS");
  });

  it("NEEDS_ALIAS quand le club est inconnu", async () => {
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed({ club: "Zzvest Inconnu" }), index);
    expect(r).toEqual({ jerseyId: null, matchStatus: "NEEDS_ALIAS" });
  });

  it("MATCHED par l'année de début quand le catalogue range le maillot par année", async () => {
    const yearJersey = await createTestJersey(clubId, { season: "2025", type: "AWAY" });
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed({ season: "2025-26", type: "AWAY" }), index);
    expect(r).toEqual({ jerseyId: yearJersey.id, matchStatus: "MATCHED" });
  });

  it("préfère la saison exacte au repli", async () => {
    await createTestJersey(clubId, { season: "2022", type: "HOME" });
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed(), index);
    expect(r).toEqual({ jerseyId, matchStatus: "MATCHED" });
  });

  it("NO_JERSEY quand le club existe mais pas ce maillot", async () => {
    const index = await loadClubIndex("test-shop");
    const r = await resolvePartnerMatch(parsed({ season: "1999-00" }), index);
    expect(r).toEqual({ jerseyId: null, matchStatus: "NO_JERSEY" });
  });
});
