import { describe, it, expect } from "vitest";
import type { EbayItem } from "./client";
import {
  aggregateEbay,
  buildQueries,
  filterItems,
  itemPriceEur,
  searchName,
  seasonShort,
  seasonSlash,
} from "./matching";

const item = (title: string, value: string, currency = "GBP"): EbayItem => ({
  title,
  price: { value, currency },
});

describe("searchName", () => {
  it("traduit une nation FR->EN", () => {
    expect(searchName({ name: "Mexique" })).toBe("Mexico");
    expect(searchName({ name: "Angleterre" })).toBe("England");
  });
  it("retire les suffixes verbeux d'un club", () => {
    expect(searchName({ name: "Wolverhampton Wanderers FC" })).toBe("Wolverhampton");
  });
  it("laisse un club déjà anglophone intact", () => {
    expect(searchName({ name: "Liverpool" })).toBe("Liverpool");
  });
  it("traduit malgré un préfixe FC (nettoyage avant traduction)", () => {
    expect(searchName({ name: "FC Barcelone" })).toBe("Barcelona");
  });
  it("traduit un club multi-mots francisé", () => {
    expect(searchName({ name: "Red Bull Salzbourg" })).toBe("Red Bull Salzburg");
  });
});

describe("season formats", () => {
  it("slash", () => expect(seasonSlash("2024-25")).toBe("2024/25"));
  it("court", () => expect(seasonShort("2024-25")).toBe("24/25"));
  it("année simple inchangée", () => expect(seasonShort("2020")).toBe("2020"));
});

describe("buildQueries", () => {
  it("compose club EN + saison + type", () => {
    const qs = buildQueries({ season: "2024-25", type: "HOME", club: { name: "Mexique" } });
    expect(qs[0]).toBe("Mexico 2024/25 home shirt");
    expect(qs).toContain("Mexico 24/25 home shirt");
  });
  it("sans mot-clé pour un type non fiable (SPECIAL)", () => {
    const qs = buildQueries({ season: "2020", type: "SPECIAL", club: { name: "France" } });
    expect(qs[0]).toBe("France 2020 shirt");
  });
});

describe("itemPriceEur", () => {
  it("convertit GBP->EUR", () => {
    expect(itemPriceEur(item("x", "100", "GBP"))).toBeCloseTo(117);
  });
  it("null si devise inconnue", () => {
    expect(itemPriceEur(item("x", "100", "JPY"))).toBeNull();
  });
  it("null si prix invalide", () => {
    expect(itemPriceEur(item("x", "0", "EUR"))).toBeNull();
  });
});

describe("filterItems", () => {
  it("exclut match worn, player issue, tailles enfant, signé, floqué", () => {
    const items = [
      item("France 2020 home shirt", "40"),
      item("France 2020 Match Worn shirt", "500"),
      item("France 2020 player issue", "120"),
      item("France 2020 home shirt KIDS", "20"),
      item("France 2020 shirt signed Mbappe", "300"),
      item("France 2020 Home Shirt #10 Mbappe", "90"),
      item("France 2020 home shirt with nameset", "70"),
    ];
    const kept = filterItems(items);
    expect(kept).toHaveLength(1);
    expect(kept[0].title).toContain("home shirt");
  });
});

describe("aggregateEbay", () => {
  it("null en dessous de 2 comparables", () => {
    expect(aggregateEbay([item("a", "40")])).toBeNull();
  });
  it("médiane en EUR sur des prix GBP propres", () => {
    // 3 prix GBP 10/20/30 -> médiane 20 GBP -> 23.4 EUR
    const agg = aggregateEbay([item("a", "10"), item("b", "20"), item("c", "30")]);
    expect(agg?.sampleSize).toBe(3);
    expect(agg?.currency).toBe("GBP");
    expect(agg?.medianPrice).toBeCloseTo(23.4);
  });
  it("rogne les extrêmes au-delà de 8 annonces", () => {
    // 9 prix EUR 1..8 + un outlier 1000 : le trim écarte l'extrême haut.
    const prices = ["1", "2", "3", "4", "5", "6", "7", "8", "1000"];
    const agg = aggregateEbay(prices.map((p, i) => item(`x${i}`, p, "EUR")));
    expect(agg?.medianPrice).toBeLessThan(10);
  });
});
