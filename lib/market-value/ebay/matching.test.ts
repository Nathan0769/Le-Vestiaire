import { describe, it, expect } from "vitest";
import type { EbayItem } from "./client";
import {
  aggregateEbay,
  buildQueries,
  filterItems,
  isEbayComparable,
  itemPriceEur,
  searchName,
  seasonShort,
  seasonSlash,
  seasonTokens,
  type JerseyForQuery,
} from "./matching";

const item = (title: string, value: string, currency = "GBP"): EbayItem => ({
  title,
  price: { value, currency },
});

const FRANCE_2020: JerseyForQuery = { season: "2020", type: "HOME", club: { name: "France" } };
const titles = (items: EbayItem[]) => items.map((i) => i.title);

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
    const kept = filterItems(items, FRANCE_2020);
    expect(kept).toHaveLength(1);
    expect(kept[0].title).toContain("home shirt");
  });

  it("écarte les vendeurs à moins de 50 évaluations (indice de contrefaçon)", () => {
    const kept = filterItems([
      { ...item("France 2020 home shirt", "40"), seller: { feedbackScore: 12 } },
      { ...item("France 2020 home shirt", "45"), seller: { feedbackScore: 50 } },
      item("France 2020 home shirt", "42"),
    ], FRANCE_2020);
    expect(kept.map((i) => i.price?.value)).toEqual(["45", "42"]);
  });

  it("ne garde que la référence : supporter, manches courtes, coupe homme", () => {
    const kept = filterItems([
      item("France 2020 home shirt", "40"),
      item("France 2020 home shirt Replica", "45"),
      item("France 2020 home shirt Authentic Player Version", "90"),
      item("France 2020 home shirt Long Sleeve", "60"),
      item("France 2020 home shirt Womens", "35"),
    ], FRANCE_2020);
    expect(kept.map((i) => i.title)).toEqual([
      "France 2020 home shirt",
      "France 2020 home shirt Replica",
    ]);
  });
});

describe("aggregateEbay", () => {
  const t = "France 2020 home shirt";
  it("null en dessous de 2 comparables", () => {
    expect(aggregateEbay([item(t, "40")], FRANCE_2020)).toBeNull();
  });
  it("médiane en EUR sur des prix GBP propres", () => {
    // 3 prix GBP 10/20/30 -> médiane 20 GBP -> 23.4 EUR
    const agg = aggregateEbay([item(t, "10"), item(t, "20"), item(t, "30")], FRANCE_2020);
    expect(agg?.sampleSize).toBe(3);
    expect(agg?.currency).toBe("GBP");
    expect(agg?.medianPrice).toBeCloseTo(23.4);
  });
  it("rogne les extrêmes au-delà de 8 annonces", () => {
    // 9 prix EUR 1..8 + un outlier 1000 : le trim écarte l'extrême haut.
    const prices = ["1", "2", "3", "4", "5", "6", "7", "8", "1000"];
    const agg = aggregateEbay(prices.map((p) => item(t, p, "EUR")), FRANCE_2020);
    expect(agg?.medianPrice).toBeLessThan(10);
  });
});

// Vague 1 (2026-11-21) : tri strict des annonces. Spec docs/specs/2026-11-21-cote-vague-1.md.
describe("seasonTokens", () => {
  it("toutes les graphies d'une saison sur deux ans", () => {
    expect(seasonTokens("2024-25")).toEqual(
      expect.arrayContaining(["2024/25", "2024-25", "24/25", "24-25", "2024/2025", "2024-2025", "2024 25"])
    );
  });
  it("passage de siècle", () => {
    expect(seasonTokens("1999-00")).toEqual(expect.arrayContaining(["1999/00", "99/00", "1999/2000"]));
  });
  it("saison sur une année", () => {
    expect(seasonTokens("2024")).toEqual(["2024"]);
  });
});

describe("filterItems : saison", () => {
  const arsenal: JerseyForQuery = { season: "2024-25", type: "HOME", club: { name: "Arsenal" } };
  it("garde la bonne saison sous ses graphies, écarte les autres saisons", () => {
    const kept = filterItems(
      [
        item("Arsenal 24/25 home shirt", "40"),
        item("Arsenal 2024-2025 home shirt", "40"),
        item("Arsenal 2023/24 home shirt", "40"),
        item("Arsenal home shirt", "40"),
        item("Arsenal 2023/24 2024/25 home shirt", "40"),
      ],
      arsenal
    );
    expect(titles(kept)).toEqual(["Arsenal 24/25 home shirt", "Arsenal 2024-2025 home shirt"]);
  });
});

describe("filterItems : club", () => {
  it("accepte le nom d'usage et les alias, écarte un autre club", () => {
    const om: JerseyForQuery = { season: "1990-91", type: "AWAY", club: { name: "Olympique de Marseille" } };
    const psg: JerseyForQuery = { season: "2024-25", type: "HOME", club: { name: "Paris Saint-Germain" } };
    expect(titles(filterItems([item("Marseille 1990/91 away shirt", "70"), item("Lyon 1990/91 away shirt", "70")], om)))
      .toEqual(["Marseille 1990/91 away shirt"]);
    expect(titles(filterItems([item("PSG 2024/25 home shirt", "40"), item("Paris Saint Germain 24/25 home shirt", "40")], psg)))
      .toHaveLength(2);
  });
});

describe("filterItems : type", () => {
  it("écarte un autre type, reconnaît 3rd", () => {
    const away: JerseyForQuery = { season: "1990-91", type: "AWAY", club: { name: "Olympique de Marseille" } };
    const third: JerseyForQuery = { season: "2019-20", type: "THIRD", club: { name: "Liverpool FC" } };
    expect(titles(filterItems([item("Marseille 1990/91 Retro Home Shirt", "30"), item("Marseille 1990/91 away shirt", "70")], away)))
      .toEqual(["Marseille 1990/91 away shirt"]);
    expect(titles(filterItems([item("Liverpool 2019/20 3rd shirt", "20"), item("Liverpool 2019/20 away shirt", "20")], third)))
      .toEqual(["Liverpool 2019/20 3rd shirt"]);
  });
  it("un maillot de gardien peut s'appeler home goalkeeper", () => {
    const gk: JerseyForQuery = { season: "2020", type: "GOALKEEPER", club: { name: "France" } };
    expect(filterItems([item("France 2020 home goalkeeper shirt", "50")], gk)).toHaveLength(1);
    expect(filterItems([item("France 2020 home goalkeeper shirt", "50")], FRANCE_2020)).toHaveLength(0);
  });
});

describe("filterItems : vêtements et mots entiers", () => {
  it("écarte shorts, training, anthem jacket ; garde short sleeve et designed", () => {
    const kept = filterItems(
      [
        item("France 2020 home shorts", "20"),
        item("France 2020 home training top", "20"),
        item("France 2020 home anthem jacket", "20"),
        item("France 2020 home shirt short sleeve", "40"),
        item("France 2020 home shirt designed by Nike", "40"),
      ],
      FRANCE_2020
    );
    expect(titles(kept)).toEqual(["France 2020 home shirt short sleeve", "France 2020 home shirt designed by Nike"]);
  });
});

describe("filterItems : enfant", () => {
  it.each([
    "France 2020 home shirt Childs Size 12/13 yrs",
    "Maillot France 2020 domicile enfant 10 ans",
    "France 2020 home shirt size 152",
    "France 2020 home shirt XLB",
    "France 2020 home shirt YXL",
    "France 2020 home shirt 9-10",
  ])("%s -> écarté", (title) => {
    expect(filterItems([item(title, "20")], FRANCE_2020)).toHaveLength(0);
  });
  it("une taille adulte est gardée", () => {
    expect(filterItems([item("France 2020 home shirt Size L", "40")], FRANCE_2020)).toHaveLength(1);
  });
});

describe("aggregateEbay : état", () => {
  it("ramène le neuf (1000, 1500) à l'état de référence avant la médiane", () => {
    const t = "France 2020 home shirt";
    const agg = aggregateEbay(
      [
        { ...item(t, "125", "EUR"), conditionId: "1000" },
        { ...item(t, "125", "EUR"), conditionId: "1500" },
        item(t, "100", "EUR"),
      ],
      FRANCE_2020
    );
    expect(agg?.medianPrice).toBe(100);
  });
});

describe("isEbayComparable", () => {
  it("vrai pour les types principaux en variante 1 seulement", () => {
    expect(isEbayComparable({ type: "HOME", variant: 1 })).toBe(true);
    expect(isEbayComparable({ type: "GOALKEEPER", variant: 1 })).toBe(true);
    expect(isEbayComparable({ type: "FOURTH", variant: 1 })).toBe(false);
    expect(isEbayComparable({ type: "ANNIVERSARY", variant: 1 })).toBe(false);
    expect(isEbayComparable({ type: "HOME", variant: 2 })).toBe(false);
  });
});

describe("searchName : nom d'usage des vendeurs", () => {
  it.each([
    ["Olympique de Marseille", "Marseille"],
    ["Valence CF", "Valencia"],
    ["Olympique Lyonnais", "Lyon"],
    ["Cap-Vert", "Cape Verde"],
    ["RC Lens", "Lens"],
    ["SC Braga", "Braga"],
    ["Montpellier HSC", "Montpellier"],
  ])("%s -> %s", (name, expected) => {
    expect(searchName({ name })).toBe(expected);
  });
});

// Dry-run du 2026-11-22 : 21 % des maillots perdaient leur donnée eBay.
describe("filterItems : année de début seule", () => {
  const lens: JerseyForQuery = { season: "2024-25", type: "THIRD", club: { name: "RC Lens" } };
  it("accepte « 2024 » pour un maillot 2024-25, pas « 2025 » seul ni une autre année", () => {
    const kept = filterItems(
      [item("Lens third shirt 2024", "40"), item("Lens third shirt 2025", "40"), item("Lens third shirt 2023", "40")],
      lens
    );
    expect(titles(kept)).toEqual(["Lens third shirt 2024"]);
  });
});

describe("searchName / club : noms à particules et accents", () => {
  it.each([
    ["Atlético de Madrid", "Atletico Madrid"],
    ["1. FC Cologne", "Koln"],
    ["Girondins de Bordeaux", "Bordeaux"],
    ["AC Perugia Calcio", "Perugia"],
  ])("%s -> %s", (name, expected) => {
    expect(searchName({ name })).toBe(expected);
  });

  it("la requête part sans accents", () => {
    expect(buildQueries({ season: "2024-25", type: "HOME", club: { name: "Real Betis Balompié" } })[0]).not.toMatch(/[éè]/);
  });

  it("reconnaît le club sans les particules ni les accents du nom catalogue", () => {
    const atm: JerseyForQuery = { season: "2023-24", type: "THIRD", club: { name: "Atlético de Madrid" } };
    const koln: JerseyForQuery = { season: "2024-25", type: "HOME", club: { name: "1. FC Cologne" } };
    expect(filterItems([item("Atletico Madrid 2023/24 third shirt", "40")], atm)).toHaveLength(1);
    expect(filterItems([item("FC Köln 2024/25 home shirt", "40"), item("Cologne 24/25 home shirt", "40")], koln)).toHaveLength(2);
  });
});

// Diagnostic du 2026-11-22 sur les maillots perdus au dry-run.
describe("filterItems : titres traduits par eBay et état « 9/10 »", () => {
  it("reconnaît une sélection dans les titres traduits (DE, IT, ES)", () => {
    const sweden: JerseyForQuery = { season: "2026", type: "AWAY", club: { name: "Suède" } };
    const kept = filterItems(
      [
        item("Schweden 2026-2027 Auswärtstrikot Gr. M *Neu mit Etikett* JM5814", "60"),
        item("Maglia trasferta Svezia 2026-2027 taglia M *BNWT* JM5814", "60"),
      ],
      sweden
    );
    expect(kept).toHaveLength(2);
  });

  it("« Lione » pour Lyon", () => {
    const lyon: JerseyForQuery = { season: "2015-16", type: "AWAY", club: { name: "Olympique Lyonnais" } };
    expect(filterItems([item("Maglia calcio Lione 2015/16 Away Adidas rosso navy uomo grande", "40")], lyon)).toHaveLength(1);
  });

  it("une note d'état « 9/10 » n'est pas une taille enfant", () => {
    const monaco: JerseyForQuery = { season: "2013-14", type: "AWAY", club: { name: "AS Monaco" } };
    expect(filterItems([item("AS Monaco Away Shirt 2013/14 (M) (Used; Condition 9/10)", "40")], monaco)).toHaveLength(1);
  });
});
