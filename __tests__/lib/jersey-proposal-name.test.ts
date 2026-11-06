import { describe, it, expect } from "vitest";
import { buildFrenchJerseyName } from "@/lib/jersey-proposal-name";

describe("buildFrenchJerseyName", () => {
  it("construit le nom en français quel que soit le type", () => {
    expect(
      buildFrenchJerseyName({ clubShortName: "Betis", type: "AWAY", season: "2025-26" })
    ).toBe("Maillot Extérieur Betis 2025-26");
  });

  it("garde le nom saisi pour un maillot spécial", () => {
    expect(
      buildFrenchJerseyName({
        clubShortName: "Betis",
        type: "SPECIAL",
        season: "2025-26",
        specialName: "  Centenaire  ",
      })
    ).toBe("Maillot Centenaire Betis 2025-26");
  });

  it("retombe sur Spécial si le nom spécial est vide", () => {
    expect(
      buildFrenchJerseyName({ clubShortName: "Betis", type: "SPECIAL", season: "2025-26", specialName: " " })
    ).toBe("Maillot Spécial Betis 2025-26");
  });
});
