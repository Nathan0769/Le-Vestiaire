import { describe, it, expect } from "vitest";
import { seasonCandidates } from "@/lib/partner-shops/season-candidates";

describe("seasonCandidates", () => {
  it("essaie d'abord la saison exacte, puis chaque année couverte (sélections)", () => {
    expect(seasonCandidates("2025-26")).toEqual(["2025-26", "2025", "2026"]);
  });

  it("retrouve l'année d'un maillot de sélection porté sur deux ans (2005-07 -> 2006)", () => {
    expect(seasonCandidates("2005-07")).toEqual(["2005-07", "2005-06", "2006-07", "2005", "2006", "2007"]);
  });

  it("pour une année seule, essaie la saison qui commence puis celle qui finit cette année-là", () => {
    expect(seasonCandidates("2025")).toEqual(["2025", "2025-26", "2024-25"]);
  });

  it("pour un maillot porté plusieurs saisons, essaie chaque saison couverte", () => {
    expect(seasonCandidates("2008-10")).toEqual(["2008-10", "2008-09", "2009-10", "2008", "2009", "2010"]);
    expect(seasonCandidates("1998-00")).toEqual(["1998-00", "1998-99", "1999-00", "1998", "1999", "2000"]);
  });

  it("gère le passage de siècle", () => {
    expect(seasonCandidates("1999-00")).toEqual(["1999-00", "1999", "2000"]);
    expect(seasonCandidates("2000")).toEqual(["2000", "2000-01", "1999-00"]);
  });

  it("ne renvoie que la saison telle quelle si le format est inconnu", () => {
    expect(seasonCandidates("saison")).toEqual(["saison"]);
  });
});
