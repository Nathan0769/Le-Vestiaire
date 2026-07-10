import { describe, it, expect, beforeAll } from "vitest";
import { resolveCfsMatch } from "@/lib/cfs-matcher";
import prisma from "@/lib/prisma";

describe("resolveCfsMatch", () => {
  let sampleJerseyId: string;
  let sampleClubId: string;
  let sampleSeason: string;

  beforeAll(async () => {
    const jersey = await prisma.jersey.findFirst({
      where: { type: "HOME" },
      select: { id: true, clubId: true, season: true },
      orderBy: { variant: "asc" },
    });
    if (!jersey) throw new Error("DB de dev doit contenir au moins un Jersey HOME");
    sampleJerseyId = jersey.id;
    sampleClubId = jersey.clubId;
    sampleSeason = jersey.season;
  });

  it("retourne MATCHED quand alias + parse + jersey existent", async () => {
    const aliasMap = new Map([["__Test FC__", sampleClubId]]);
    const result = await resolveCfsMatch(
      { name: `${sampleSeason} __Test FC__ Home Shirt`, club: "__Test FC__" },
      aliasMap
    );

    expect(result.matchStatus).toBe("MATCHED");
    expect(result.jerseyId).toBe(sampleJerseyId);
    expect(result.season).toBe(sampleSeason);
    expect(result.type).toBe("HOME");
  });

  it("retourne NEEDS_ALIAS si le club CFS n'a pas d'alias", async () => {
    const aliasMap = new Map<string, string>();
    const result = await resolveCfsMatch(
      { name: "2024-25 Unknown Club Home Shirt", club: "Unknown Club" },
      aliasMap
    );

    expect(result.matchStatus).toBe("NEEDS_ALIAS");
    expect(result.jerseyId).toBeNull();
    expect(result.season).toBe("2024-25");
    expect(result.type).toBe("HOME");
  });

  it("retourne NEEDS_ALIAS si club null", async () => {
    const aliasMap = new Map<string, string>();
    const result = await resolveCfsMatch(
      { name: "2024-25 Whatever Home Shirt", club: null },
      aliasMap
    );

    expect(result.matchStatus).toBe("NEEDS_ALIAS");
  });

  it("retourne PARSE_FAILED si season manque", async () => {
    const aliasMap = new Map([["Test FC", "irrelevant"]]);
    const result = await resolveCfsMatch(
      { name: "Test FC Home Shirt", club: "Test FC" },
      aliasMap
    );

    expect(result.matchStatus).toBe("PARSE_FAILED");
  });

  it("retourne PARSE_FAILED si type manque", async () => {
    const aliasMap = new Map([["Test FC", "irrelevant"]]);
    const result = await resolveCfsMatch(
      { name: "2024-25 Test FC", club: "Test FC" },
      aliasMap
    );

    expect(result.matchStatus).toBe("PARSE_FAILED");
  });

  it("retourne NO_JERSEY si alias OK mais (clubId, season, type) inexistant", async () => {
    const aliasMap = new Map([["__Test FC__", "no-such-club-id-anywhere"]]);
    const result = await resolveCfsMatch(
      { name: "2024-25 __Test FC__ Home Shirt", club: "__Test FC__" },
      aliasMap
    );

    expect(result.matchStatus).toBe("NO_JERSEY");
    expect(result.jerseyId).toBeNull();
    expect(result.season).toBe("2024-25");
    expect(result.type).toBe("HOME");
  });
});
