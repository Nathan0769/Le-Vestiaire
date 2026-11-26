import { describe, it, expect } from "vitest";
import {
  matchesSearch,
  normalizeSearchText,
  SEARCH_ACCENTS_FROM,
  SEARCH_ACCENTS_TO,
} from "@/lib/search-text";

describe("normalizeSearchText", () => {
  it("retire accents et lettres spéciales", () => {
    expect(normalizeSearchText("Atlético Madrid")).toBe("atleticomadrid");
    expect(normalizeSearchText("Brøndby")).toBe("brondby");
    expect(normalizeSearchText("Beşiktaş")).toBe("besiktas");
    expect(normalizeSearchText("Fenerbahçe")).toBe("fenerbahce");
    expect(normalizeSearchText("Legia Warszawa Łódź")).toBe("legiawarszawalodz");
  });

  it("ignore tirets, apostrophes, points et espaces", () => {
    expect(normalizeSearchText("Paris Saint-Germain")).toBe(
      normalizeSearchText("paris saint germain"),
    );
    expect(normalizeSearchText("Borussia M'gladbach")).toBe("borussiamgladbach");
    expect(normalizeSearchText("1. FC Köln")).toBe("1fckoln");
  });

  it("garde des tables de traduction SQL de même longueur", () => {
    expect([...SEARCH_ACCENTS_FROM].length).toBe([...SEARCH_ACCENTS_TO].length);
  });
});

describe("matchesSearch", () => {
  it("trouve un nom accentué tapé sans accent", () => {
    expect(matchesSearch("Nîmes Olympique", "nimes")).toBe(true);
    expect(matchesSearch("Süper Lig", "super")).toBe(true);
  });

  it("ne garde pas un nom qui ne contient pas la recherche", () => {
    expect(matchesSearch("Olympique Lyonnais", "nimes")).toBe(false);
  });

  it("garde tout pour une recherche vide", () => {
    expect(matchesSearch("Ligue 1", "  ")).toBe(true);
  });
});
