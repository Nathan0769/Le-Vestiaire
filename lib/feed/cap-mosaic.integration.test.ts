import { describe, it, expect, beforeEach } from "vitest";
import {
  createTestUser,
  createTestLeague,
  createTestClub,
  createTestJersey,
} from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";
import { computeCapMosaics } from "./cap-mosaic";

describe("computeCapMosaics", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne une map vide pour aucun auteur", async () => {
    const result = await computeCapMosaics([]);
    expect(result.size).toBe(0);
  });

  it("retourne les {limit} maillots les plus récents, du plus récent au plus ancien", async () => {
    const user = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);

    // 5 maillots, createdAt croissant (i=0 le plus ancien, i=4 le plus récent)
    for (let i = 0; i < 5; i++) {
      const jersey = await createTestJersey(club.id, {
        variant: i + 1,
        imageUrl: `img-${i}`,
      });
      await prismaTest.userJersey.create({
        data: {
          userId: user.id,
          jerseyId: jersey.id,
          condition: "GOOD",
          createdAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
        },
      });
    }

    const result = await computeCapMosaics([user.id], 4);
    const mosaic = result.get(user.id);

    expect(mosaic).toHaveLength(4);
    expect(mosaic!.map((m) => m.imageUrl)).toEqual([
      "img-4",
      "img-3",
      "img-2",
      "img-1",
    ]);
  });

  it("retourne tous les maillots si moins que la limite", async () => {
    const user = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);

    const jersey = await createTestJersey(club.id, { imageUrl: "solo" });
    await prismaTest.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    const result = await computeCapMosaics([user.id], 4);
    expect(result.get(user.id)).toEqual([{ imageUrl: "solo" }]);
  });

  it("isole les auteurs entre eux", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);

    const jA = await createTestJersey(club.id, { variant: 1, imageUrl: "alice" });
    const jB = await createTestJersey(club.id, { variant: 2, imageUrl: "bob" });

    await prismaTest.userJersey.create({
      data: { userId: alice.id, jerseyId: jA.id, condition: "GOOD" },
    });
    await prismaTest.userJersey.create({
      data: { userId: bob.id, jerseyId: jB.id, condition: "GOOD" },
    });

    const result = await computeCapMosaics([alice.id, bob.id], 4);
    expect(result.get(alice.id)).toEqual([{ imageUrl: "alice" }]);
    expect(result.get(bob.id)).toEqual([{ imageUrl: "bob" }]);
  });
});
