import { describe, it, expect } from "vitest";
import type { PatchFamily } from "@prisma/client";
import {
  getExclusivityGroup,
  getLockedGroup,
  hasExclusivityConflict,
} from "./patch-exclusivity";

describe("getExclusivityGroup", () => {
  it("classe les badges championnat dans DOMESTIC", () => {
    expect(getExclusivityGroup("DOMESTIC_LEAGUE_BADGE")).toBe("DOMESTIC");
    expect(getExclusivityGroup("DOMESTIC_CHAMPION")).toBe("DOMESTIC");
  });

  it("classe les compétitions inter-clubs dans CONTINENTAL", () => {
    expect(getExclusivityGroup("UEFA_COMPETITION")).toBe("CONTINENTAL");
    expect(getExclusivityGroup("CONFED_CLUB_COMPETITION")).toBe("CONTINENTAL");
    expect(getExclusivityGroup("FIFA_CLUB_COMPETITION")).toBe("CONTINENTAL");
  });

  it("renvoie null pour les familles non contraintes", () => {
    const unconstrained: PatchFamily[] = [
      "DOMESTIC_CUP",
      "DOMESTIC_SUPERCUP",
      "NATIONAL_TEAM_COMPETITION",
      "CUSTOM",
    ];
    for (const f of unconstrained) {
      expect(getExclusivityGroup(f)).toBeNull();
    }
  });
});

describe("getLockedGroup", () => {
  it("renvoie null quand aucun patch contraint n'est sélectionné", () => {
    expect(getLockedGroup([])).toBeNull();
    expect(getLockedGroup(["DOMESTIC_CUP", "CUSTOM"])).toBeNull();
  });

  it("renvoie DOMESTIC quand un badge championnat est présent", () => {
    expect(getLockedGroup(["DOMESTIC_CUP", "DOMESTIC_LEAGUE_BADGE"])).toBe(
      "DOMESTIC"
    );
  });

  it("renvoie CONTINENTAL quand une compétition continentale est présente", () => {
    expect(getLockedGroup(["CUSTOM", "UEFA_COMPETITION"])).toBe("CONTINENTAL");
  });
});

describe("hasExclusivityConflict", () => {
  it("false si un seul groupe est présent", () => {
    expect(
      hasExclusivityConflict(["DOMESTIC_LEAGUE_BADGE", "DOMESTIC_CHAMPION"])
    ).toBe(false);
    expect(
      hasExclusivityConflict(["UEFA_COMPETITION", "FIFA_CLUB_COMPETITION"])
    ).toBe(false);
  });

  it("false si aucune famille contrainte", () => {
    expect(hasExclusivityConflict(["DOMESTIC_CUP", "CUSTOM"])).toBe(false);
  });

  it("true si les deux groupes coexistent", () => {
    expect(
      hasExclusivityConflict(["DOMESTIC_LEAGUE_BADGE", "UEFA_COMPETITION"])
    ).toBe(true);
    expect(
      hasExclusivityConflict(["DOMESTIC_CHAMPION", "CONFED_CLUB_COMPETITION"])
    ).toBe(true);
  });
});
