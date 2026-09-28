import { describe, it, expect } from "vitest";
import {
  getUefaBadgeRank,
  pickTopUefaBadgeId,
  type UefaBadgeCandidate,
} from "./uefa-badge-precedence";

describe("getUefaBadgeRank", () => {
  it("tenant du titre LDC = rang 3", () => {
    expect(getUefaBadgeRank("UEFA_TITLE_HOLDER")).toBe(3);
  });

  it("tenant du titre Europa League = rang 3", () => {
    expect(getUefaBadgeRank("UEFA_EL_TITLE_HOLDER")).toBe(3);
  });

  it("badge of honour = rang 2", () => {
    expect(getUefaBadgeRank("UEFA_BADGE_OF_HONOUR")).toBe(2);
  });

  it("starball = rang 1", () => {
    expect(getUefaBadgeRank("UEFA_STARBALL")).toBe(1);
  });

  it("variant null = rang 1", () => {
    expect(getUefaBadgeRank(null)).toBe(1);
  });
});

function candidate(
  overrides: Partial<UefaBadgeCandidate> = {}
): UefaBadgeCandidate {
  return {
    id: "c",
    variant: "UEFA_STARBALL",
    hasActiveVersion: true,
    ...overrides,
  };
}

describe("pickTopUefaBadgeId", () => {
  it("liste vide = null", () => {
    expect(pickTopUefaBadgeId([])).toBeNull();
  });

  it("starball seul = starball", () => {
    expect(
      pickTopUefaBadgeId([candidate({ id: "sb", variant: "UEFA_STARBALL" })])
    ).toBe("sb");
  });

  it("starball + honour = honour", () => {
    expect(
      pickTopUefaBadgeId([
        candidate({ id: "sb", variant: "UEFA_STARBALL" }),
        candidate({ id: "ho", variant: "UEFA_BADGE_OF_HONOUR" }),
      ])
    ).toBe("ho");
  });

  it("starball + honour + tenant = tenant", () => {
    expect(
      pickTopUefaBadgeId([
        candidate({ id: "sb", variant: "UEFA_STARBALL" }),
        candidate({ id: "ho", variant: "UEFA_BADGE_OF_HONOUR" }),
        candidate({ id: "th", variant: "UEFA_TITLE_HOLDER" }),
      ])
    ).toBe("th");
  });

  it("honour sans version active est ignoré, retombe sur starball", () => {
    expect(
      pickTopUefaBadgeId([
        candidate({ id: "sb", variant: "UEFA_STARBALL" }),
        candidate({
          id: "ho",
          variant: "UEFA_BADGE_OF_HONOUR",
          hasActiveVersion: false,
        }),
      ])
    ).toBe("sb");
  });

  it("tenant + honour du même club (même saison) = tenant", () => {
    expect(
      pickTopUefaBadgeId([
        candidate({ id: "ho", variant: "UEFA_BADGE_OF_HONOUR" }),
        candidate({ id: "th", variant: "UEFA_EL_TITLE_HOLDER" }),
      ])
    ).toBe("th");
  });
});
