import { describe, it, expect } from "vitest";
import { selectFeaturedCfsPromos } from "@/lib/cfs-affiliate";

type P = { id: string; club: string | null; source: string };
const mk = (id: string, club: string | null, source = "clearance"): P => ({
  id,
  club,
  source,
});

const clubsOf = (ps: P[]) => ps.map((p) => p.club);
const idsSorted = (ps: P[]) => ps.map((p) => p.id).sort();

describe("selectFeaturedCfsPromos", () => {
  it("place des clubs distincts dans les 6 premiers quand assez de clubs existent", () => {
    const input = [
      mk("a1", "Arsenal"),
      mk("a2", "Arsenal"),
      mk("b1", "Barcelona"),
      mk("b2", "Barcelona"),
      mk("c1", "Chelsea"),
      mk("d1", "Dortmund"),
      mk("e1", "Everton"),
      mk("f1", "Fulham"),
      mk("g1", "Getafe"),
    ];

    const featured = selectFeaturedCfsPromos(input).slice(0, 6);
    const clubs = clubsOf(featured);
    expect(new Set(clubs).size).toBe(6);
  });

  it("inclut 2 weekly deals parmi les 6 premiers", () => {
    const input = [
      mk("a1", "Arsenal"),
      mk("b1", "Barcelona"),
      mk("c1", "Chelsea"),
      mk("d1", "Dortmund"),
      mk("e1", "Everton"),
      mk("f1", "Fulham"),
      mk("w1", "Xamax", "cfs-weekly-deals"),
      mk("w2", "Young Boys", "cfs-weekly-deals"),
      mk("w3", "Zurich", "cfs-weekly-deals"),
    ];

    const featured = selectFeaturedCfsPromos(input).slice(0, 6);
    const weekly = featured.filter((p) => p.source === "cfs-weekly-deals");
    expect(weekly.map((p) => p.id)).toEqual(["w1", "w2"]);
  });

  it("choisit 2 des 3 tops weekly deals avec clubs distincts (saute un doublon)", () => {
    const input = [
      mk("a1", "Arsenal"),
      mk("b1", "Barcelona"),
      mk("c1", "Chelsea"),
      mk("d1", "Dortmund"),
      mk("e1", "Everton"),
      mk("f1", "Fulham"),
      mk("w1", "Xamax", "cfs-weekly-deals"),
      mk("w2", "Xamax", "cfs-weekly-deals"), // même club que w1
      mk("w3", "Zurich", "cfs-weekly-deals"),
      mk("w4", "Wolfsburg", "cfs-weekly-deals"),
    ];

    const featured = selectFeaturedCfsPromos(input).slice(0, 6);
    const weekly = featured.filter((p) => p.source === "cfs-weekly-deals");
    expect(weekly.map((p) => p.id)).toEqual(["w1", "w3"]);
  });

  it("ne perd ni ne duplique aucune promo", () => {
    const input = [
      mk("a1", "Arsenal"),
      mk("a2", "Arsenal"),
      mk("b1", "Barcelona"),
      mk("w1", "Xamax", "cfs-weekly-deals"),
      mk("c1", "Chelsea"),
      mk("d1", "Dortmund"),
      mk("e1", "Everton"),
      mk("f1", "Fulham"),
    ];

    const out = selectFeaturedCfsPromos(input);
    expect(out).toHaveLength(input.length);
    expect(idsSorted(out)).toEqual(idsSorted(input));
  });

  it("retourne toutes les promos intactes si la liste est plus courte que 6", () => {
    const input = [mk("a1", "Arsenal"), mk("b1", "Barcelona"), mk("c1", "Chelsea")];
    const out = selectFeaturedCfsPromos(input);
    expect(idsSorted(out)).toEqual(idsSorted(input));
  });

  it("remplit quand même 6 slots si peu de clubs distincts (contrainte relâchée)", () => {
    const input = Array.from({ length: 8 }, (_, i) => mk(`a${i}`, "Arsenal"));
    const featured = selectFeaturedCfsPromos(input).slice(0, 6);
    expect(featured).toHaveLength(6);
  });

  it("ne traite pas club null comme un doublon", () => {
    const input = [
      mk("n1", null),
      mk("n2", null),
      mk("n3", null),
      mk("n4", null),
      mk("n5", null),
      mk("n6", null),
      mk("n7", null),
    ];
    const featured = selectFeaturedCfsPromos(input).slice(0, 6);
    expect(featured).toHaveLength(6);
  });
});
