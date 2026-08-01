import { describe, it, expect, beforeEach } from "vitest";
import {
  createTestUser,
  createTestLeague,
  createTestClub,
  createTestJersey,
} from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";
import { computeClubRanks } from "./club-rank";

describe("computeClubRanks", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne une map vide pour aucune cible", async () => {
    const result = await computeClubRanks([]);
    expect(result.size).toBe(0);
  });

  it("classe les maillots d'un même club par ordre chronologique (rang = position, soi inclus)", async () => {
    const user = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);
    const j1 = await createTestJersey(club.id);
    const j2 = await createTestJersey(club.id, { type: "AWAY" });

    const uj1 = await prismaTest.userJersey.create({
      data: {
        userId: user.id,
        jerseyId: j1.id,
        condition: "GOOD",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      },
    });
    const uj2 = await prismaTest.userJersey.create({
      data: {
        userId: user.id,
        jerseyId: j2.id,
        condition: "GOOD",
        createdAt: new Date("2026-01-02T10:00:00Z"),
      },
    });

    const ranks = await computeClubRanks([
      { id: uj1.id, userId: user.id, clubId: club.id, createdAt: uj1.createdAt },
      { id: uj2.id, userId: user.id, clubId: club.id, createdAt: uj2.createdAt },
    ]);

    expect(ranks.get(uj1.id)).toBe(1);
    expect(ranks.get(uj2.id)).toBe(2);
  });

  it("isole les clubs entre eux", async () => {
    const user = await createTestUser();
    const league = await createTestLeague();
    const clubA = await createTestClub(league.id, { shortName: "A" });
    const clubB = await createTestClub(league.id, { shortName: "B" });
    const jA = await createTestJersey(clubA.id);
    const jB = await createTestJersey(clubB.id);

    const ujA = await prismaTest.userJersey.create({
      data: {
        userId: user.id,
        jerseyId: jA.id,
        condition: "GOOD",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      },
    });
    const ujB = await prismaTest.userJersey.create({
      data: {
        userId: user.id,
        jerseyId: jB.id,
        condition: "GOOD",
        createdAt: new Date("2026-01-02T10:00:00Z"),
      },
    });

    const ranks = await computeClubRanks([
      { id: ujA.id, userId: user.id, clubId: clubA.id, createdAt: ujA.createdAt },
      { id: ujB.id, userId: user.id, clubId: clubB.id, createdAt: ujB.createdAt },
    ]);

    expect(ranks.get(ujA.id)).toBe(1);
    expect(ranks.get(ujB.id)).toBe(1);
  });

  it("isole les users entre eux", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);
    const j1 = await createTestJersey(club.id);
    const j2 = await createTestJersey(club.id, { type: "AWAY" });

    // Alice possède un maillot plus ancien du même club
    await prismaTest.userJersey.create({
      data: {
        userId: alice.id,
        jerseyId: j1.id,
        condition: "GOOD",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      },
    });
    const ujBob = await prismaTest.userJersey.create({
      data: {
        userId: bob.id,
        jerseyId: j2.id,
        condition: "GOOD",
        createdAt: new Date("2026-01-05T10:00:00Z"),
      },
    });

    const ranks = await computeClubRanks([
      { id: ujBob.id, userId: bob.id, clubId: club.id, createdAt: ujBob.createdAt },
    ]);

    // Le maillot d'Alice ne doit pas compter dans le rang de Bob
    expect(ranks.get(ujBob.id)).toBe(1);
  });
});
