import { describe, it, expect } from "vitest";
import { seasonCandidates } from "@/lib/partner-shops/season-candidates";

describe("seasonCandidates", () => {
  it("essaie d'abord la saison exacte, puis l'année de début (sélections)", () => {
    expect(seasonCandidates("2025-26")).toEqual(["2025-26", "2025"]);
  });

  it("pour une année seule, essaie la saison qui commence puis celle qui finit cette année-là", () => {
    expect(seasonCandidates("2025")).toEqual(["2025", "2025-26", "2024-25"]);
  });

  it("pour un maillot porté plusieurs saisons, essaie chaque saison couverte", () => {
    expect(seasonCandidates("2008-10")).toEqual(["2008-10", "2008-09", "2009-10", "2008"]);
    expect(seasonCandidates("1998-00")).toEqual(["1998-00", "1998-99", "1999-00", "1998"]);
  });

  it("gère le passage de siècle", () => {
    expect(seasonCandidates("1999-00")).toEqual(["1999-00", "1999"]);
    expect(seasonCandidates("2000")).toEqual(["2000", "2000-01", "1999-00"]);
  });

  it("ne renvoie que la saison telle quelle si le format est inconnu", () => {
    expect(seasonCandidates("saison")).toEqual(["saison"]);
  });
});
