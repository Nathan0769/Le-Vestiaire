import { describe, it, expect } from "vitest";
import type { PatchFamily } from "@prisma/client";
import {
  isYearFormat,
  validatePatchVersionPeriod,
  isJerseySeasonInPatchPeriod,
} from "./season-format";

describe("isYearFormat", () => {
  it("retourne true pour NATIONAL_TEAM_COMPETITION", () => {
    expect(isYearFormat("NATIONAL_TEAM_COMPETITION")).toBe(true);
  });

  it("retourne false pour UEFA_COMPETITION", () => {
    expect(isYearFormat("UEFA_COMPETITION")).toBe(false);
  });

  it("retourne false pour toutes les autres familles club", () => {
    const families: PatchFamily[] = [
      "CONFED_CLUB_COMPETITION",
      "FIFA_CLUB_COMPETITION",
      "DOMESTIC_LEAGUE_BADGE",
      "DOMESTIC_CHAMPION",
      "DOMESTIC_CUP",
      "DOMESTIC_SUPERCUP",
      "CUSTOM",
    ];
    for (const f of families) {
      expect(isYearFormat(f)).toBe(false);
    }
  });
});

describe("validatePatchVersionPeriod", () => {
  it("accepte une plage en année pour un patch national", () => {
    expect(
      validatePatchVersionPeriod("NATIONAL_TEAM_COMPETITION", "2024", null)
    ).toEqual({ valid: true });
  });

  it("rejette le format saison pour un patch national", () => {
    const result = validatePatchVersionPeriod(
      "NATIONAL_TEAM_COMPETITION",
      "2024-25",
      null
    );
    expect(result.valid).toBe(false);
  });

  it("accepte une plage en saison pour un patch UEFA", () => {
    expect(
      validatePatchVersionPeriod("UEFA_COMPETITION", "2024-25", null)
    ).toEqual({ valid: true });
  });

  it("rejette le format année pour un patch UEFA", () => {
    const result = validatePatchVersionPeriod(
      "UEFA_COMPETITION",
      "2024",
      null
    );
    expect(result.valid).toBe(false);
  });

  it("rejette end inférieur à start (national)", () => {
    const result = validatePatchVersionPeriod(
      "NATIONAL_TEAM_COMPETITION",
      "2026",
      "2024"
    );
    expect(result.valid).toBe(false);
  });

  it("rejette end inférieur à start (club)", () => {
    const result = validatePatchVersionPeriod(
      "UEFA_COMPETITION",
      "2025-26",
      "2024-25"
    );
    expect(result.valid).toBe(false);
  });

  it("accepte end égal à start", () => {
    expect(
      validatePatchVersionPeriod("NATIONAL_TEAM_COMPETITION", "2024", "2024")
    ).toEqual({ valid: true });
  });

  it("accepte end null", () => {
    expect(
      validatePatchVersionPeriod("UEFA_COMPETITION", "2024-25", null)
    ).toEqual({ valid: true });
  });

  it("rejette un start mal formé pour un patch national", () => {
    const result = validatePatchVersionPeriod(
      "NATIONAL_TEAM_COMPETITION",
      "abcd",
      null
    );
    expect(result.valid).toBe(false);
  });

  it("rejette un end mal formé pour un patch club", () => {
    const result = validatePatchVersionPeriod(
      "UEFA_COMPETITION",
      "2024-25",
      "2025"
    );
    expect(result.valid).toBe(false);
  });
});

describe("isJerseySeasonInPatchPeriod", () => {
  it("matche année identique côté national", () => {
    expect(isJerseySeasonInPatchPeriod("2024", "2024", "2024")).toBe(true);
  });

  it("matche année dans une plage ouverte côté national", () => {
    expect(isJerseySeasonInPatchPeriod("2024", "2024", null)).toBe(true);
  });

  it("ne matche pas une année antérieure au start", () => {
    expect(isJerseySeasonInPatchPeriod("2023", "2024", null)).toBe(false);
  });

  it("ne matche pas une année postérieure au end", () => {
    expect(isJerseySeasonInPatchPeriod("2027", "2024", "2026")).toBe(false);
  });

  it("matche une saison club identique", () => {
    expect(isJerseySeasonInPatchPeriod("2024-25", "2024-25", null)).toBe(true);
  });

  it("ne matche pas une saison club hors fenêtre", () => {
    expect(
      isJerseySeasonInPatchPeriod("2023-24", "2024-25", "2025-26")
    ).toBe(false);
  });

  it("matche une saison club dans la fenêtre", () => {
    expect(
      isJerseySeasonInPatchPeriod("2024-25", "2023-24", "2025-26")
    ).toBe(true);
  });
});
