import { describe, it, expect } from "vitest";
import { aggregate as realAggregate, usesMarketBase, valueForCondition, valueForItem, type AggregateOptions } from "./aggregate";
import { ASKING_ABATEMENT } from "./config";
import type { PriceSignal } from "./types";

// Les cas historiques sont écrits avec les abattements de la méthode 1 (0,85 / 0,73).
const aggregate = (signals: PriceSignal[], options: AggregateOptions = {}) =>
  realAggregate(signals, { methodVersion: 1, ...options });

const sold = (price: number, source: PriceSignal["source"] = "ebay", condition?: PriceSignal["condition"]): PriceSignal => ({
  price,
  type: "sold",
  source,
  condition,
});
const asking = (
  price: number,
  source: PriceSignal["source"] = "cfs",
  observations?: number
): PriceSignal => ({
  price,
  type: "asking",
  source,
  observations,
});

describe("aggregate", () => {
  it("retourne null sans signal", () => {
    expect(aggregate([])).toBeNull();
  });

  it("abat un prix demandé CFS (calibré sur eBay, facteur 0,73)", () => {
    const est = aggregate([asking(100, "cfs")]);
    expect(est?.baseValue).toBe(73);
    expect(est?.confidence).toBe("low");
    expect(est?.sources).toEqual(["cfs"]);
  });

  it("abat un prix demandé eBay (asking, facteur 0.85)", () => {
    expect(aggregate([asking(100, "ebay")])?.baseValue).toBe(85);
  });

  it("normalise l'état par-dessus l'abattement", () => {
    // MINT 125 et GOOD 100 doivent donner la même base après normalisation :
    // 125 * 0.85 / 1.25 = 85 ; 100 * 0.85 / 1.0 = 85
    expect(aggregate([sold(125, "ebay", "MINT")])?.baseValue).toBe(85);
    expect(aggregate([sold(100, "ebay", "GOOD")])?.baseValue).toBe(85);
  });

  it("résume chaque source par sa médiane, puis fait la moyenne des sources à poids égal", () => {
    const est = aggregate([asking(80, "ebay"), asking(120, "ebay"), asking(200, "cfs"), asking(200, "cfs")]);
    // eBay : médiane de 68 et 102 = 85 ; CFS : 146 -> (85 + 146) / 2 = 115,5
    expect(est?.baseValue).toBe(115.5);
  });

  it("confiance HAUTE dès qu'une source agrège beaucoup d'annonces concordantes", () => {
    // 1 seul signal eBay mais 40 annonces réelles, peu dispersées -> haute confiance.
    const est = aggregate([{ ...asking(50, "ebay", 40), p25: 46, p75: 54 }]);
    expect(est?.confidence).toBe("high");
    expect(est?.sampleSize).toBe(40);
  });

  it("confiance moyenne autour de 8-19 observations", () => {
    expect(aggregate([asking(50, "ebay", 10)])?.confidence).toBe("medium");
  });

  it("palier moyen dès 4 observations si 2 sources concordent", () => {
    // Chaque source atteint le seuil de vote (2 observations).
    const est = aggregate([asking(50, "ebay", 2), asking(60, "cfs", 2)]);
    // 4 observations + 2 sources -> medium
    expect(est?.confidence).toBe("medium");
  });

  it("confiance faible en dessous de 8 observations, source unique", () => {
    expect(aggregate([asking(50, "ebay", 2)])?.confidence).toBe("low");
    expect(aggregate([asking(50, "cfs", 1)])?.confidence).toBe("low");
  });
});

describe("aggregate : boutiques partenaires", () => {
  const PARC = "partner:leparcamaillots" as const;

  it("ramène un prix neuf demandé à l'état GOOD avec l'abattement de la boutique", () => {
    // 100 × 1,0 / 1,25 (MINT) = 80
    const est = aggregate([{ price: 100, type: "asking", source: PARC, condition: "MINT" }]);
    expect(est?.baseValue).toBe(80);
    expect(est?.sources).toEqual([PARC]);
  });

  it("n'abat pas une vente déduite", () => {
    // 100 / 1,25 (MINT) = 80
    expect(aggregate([{ price: 100, type: "sold", source: PARC, condition: "MINT" }])?.baseValue).toBe(80);
  });

  it("compte autant qu'eBay dans la moyenne des sources", () => {
    // eBay 100 -> 85 ; Parc 200 MINT -> 160 -> (85 + 160) / 2 = 122,5
    const est = aggregate([
      { price: 100, type: "asking", source: "ebay" },
      { price: 200, type: "asking", source: PARC, condition: "MINT" },
    ]);
    expect(est?.baseValue).toBe(122.5);
  });

  it("résume prix demandés et ventes déduites d'une boutique en une seule valeur", () => {
    // Parc : 100 MINT asking -> 80, 100 MINT sold -> 80, 110 MINT sold -> 88 -> médiane 80
    // eBay : 100 -> 85 -> (80 + 85) / 2 = 82,5
    const est = aggregate([
      { price: 100, type: "asking", source: PARC, condition: "MINT" },
      { price: 100, type: "sold", source: PARC, condition: "MINT" },
      { price: 110, type: "sold", source: PARC, condition: "MINT" },
      { price: 100, type: "asking", source: "ebay", observations: 2 },
    ]);
    expect(est?.baseValue).toBe(82.5);
  });

  it("ignore une boutique absente du registre", () => {
    expect(aggregate([{ price: 100, type: "asking", source: "partner:inconnue" }])).toBeNull();
  });
});

describe("valueForItem", () => {
  it("replica GOOD = base", () => {
    expect(valueForItem(100, { condition: "GOOD", version: "REPLICA" })).toBe(100);
  });
  it("authentic majore la valeur", () => {
    expect(valueForItem(100, { condition: "GOOD", version: "AUTHENTIC" })).toBe(150);
  });
  it("compose état × version", () => {
    // MINT 1.25 × AUTHENTIC 1.5 = 187.5
    expect(valueForItem(100, { condition: "MINT", version: "AUTHENTIC" })).toBe(187.5);
  });
  it("premium manches longues et signé avec certificat", () => {
    // GOOD × replica × manches 1.2 × signé certifié 1.4 = 168
    expect(valueForItem(100, { condition: "GOOD", hasLongSleeves: true, isSigned: true, hasAuthCertificate: true })).toBe(168);
  });
  // Phase 2 (choix de Nathan, 2026-11-22).
  it("signé sans certificat : aucune prime", () => {
    expect(valueForItem(100, { condition: "GOOD", isSigned: true })).toBe(100);
  });
  it("floqué : ×1,38 mesuré sur ventes réelles", () => {
    expect(valueForItem(100, { condition: "GOOD", isPrinted: true })).toBe(138);
  });
  it("player issue mesuré sur eBay (×2,35)", () => {
    expect(valueForItem(100, { condition: "GOOD", version: "PLAYER_ISSUE" })).toBe(235);
  });
  it("version inconnue -> pas de premium (×1)", () => {
    expect(valueForItem(100, { condition: "GOOD", version: "???" })).toBe(100);
  });
});

describe("valueForCondition", () => {
  it("applique le multiplicateur d'état", () => {
    expect(valueForCondition(100, "MINT")).toBe(125);
    expect(valueForCondition(100, "GOOD")).toBe(100);
    expect(valueForCondition(100, "POOR")).toBe(60);
  });
});

describe("usesMarketBase : match worn", () => {
  it("un match worn est hors cote (pièce unique)", () => {
    expect(usesMarketBase("MATCH_WORN")).toBe(false);
  });
});

describe("usesMarketBase", () => {
  it("une réédition ne prend jamais la cote de l'original", () => {
    expect(usesMarketBase("REISSUE")).toBe(false);
  });
  it.each(["REPLICA", "AUTHENTIC", "STOCK_PRO", "PLAYER_ISSUE", undefined])(
    "%s utilise la cote",
    (version) => {
      expect(usesMarketBase(version)).toBe(true);
    }
  );
});

// Vague 1 (2026-11-21). Spec docs/specs/2026-11-21-cote-vague-1.md, décision 5.
describe("aggregate : ruptures CFS (stale)", () => {
  const stale = (price: number): PriceSignal => ({ price, type: "asking", source: "cfs", stale: true });

  it("écarte les signaux stale dès qu'un signal frais existe", () => {
    const est = aggregate([stale(200), stale(200), asking(100, "ebay", 40)]);
    expect(est?.baseValue).toBe(85);
    expect(est?.sources).toEqual(["ebay"]);
  });

  it("garde les signaux stale s'ils sont seuls, confiance basse", () => {
    const est = aggregate(Array.from({ length: 30 }, () => stale(100)));
    expect(est?.baseValue).toBe(73);
    expect(est?.confidence).toBe("low");
  });
});

describe("aggregate : seuil de vote (2 observations)", () => {
  it("une source à 1 observation ne vote pas face à une source fournie", () => {
    expect(aggregate([asking(100, "ebay", 40), asking(200, "cfs")])?.baseValue).toBe(85);
  });
  it("une source à 2 observations vote", () => {
    // eBay 85, CFS médiane(146, 146) = 146 -> moyenne 115,5
    expect(aggregate([asking(100, "ebay", 40), asking(200, "cfs"), asking(200, "cfs")])?.baseValue).toBe(115.5);
  });
  it("si aucune source n'atteint 2, toutes votent", () => {
    // eBay 85, CFS 146 -> 115,5
    expect(aggregate([asking(100, "ebay", 1), asking(200, "cfs")])?.baseValue).toBe(115.5);
  });
});

describe("aggregate : fraîcheur eBay", () => {
  const now = new Date("2026-11-21T00:00:00Z");
  const ebayAt = (days: number): PriceSignal => ({
    price: 100,
    type: "asking",
    source: "ebay",
    observations: 40,
    p25: 92,
    p75: 108,
    date: new Date(now.getTime() - days * 86_400_000),
  });

  it("perd un cran de confiance entre 21 et 60 jours", () => {
    expect(aggregate([ebayAt(5)], { now })?.confidence).toBe("high");
    expect(aggregate([ebayAt(30)], { now })?.confidence).toBe("medium");
  });
  it("ignoré au-delà de 60 jours", () => {
    expect(aggregate([ebayAt(61)], { now })).toBeNull();
  });
});

describe("aggregate : abattements par version de méthode", () => {
  it("la méthode 2 applique les abattements mesurés sur les ventes réelles", () => {
    const est = realAggregate([{ price: 100, type: "asking", source: "ebay", observations: 40 }], { methodVersion: 2 });
    expect(est?.baseValue).toBe(Math.round(100 * ASKING_ABATEMENT[2].ebay * 100) / 100);
    expect(ASKING_ABATEMENT[2].ebay).toBeLessThan(ASKING_ABATEMENT[1].ebay);
  });
  it("la méthode 1 garde les abattements d'origine", () => {
    expect(realAggregate([{ price: 100, type: "asking", source: "cfs" }], { methodVersion: 1 })?.baseValue).toBe(73);
  });
});

// Phase 2 (2026-11-22) : fourchette, confiance à points, nombres par source.
describe("aggregate : fourchette", () => {
  it("moyenne des quartiles abattus des sources", () => {
    const est = aggregate([
      { price: 100, type: "asking", source: "ebay", observations: 40, p25: 80, p75: 120 },
      ...[90, 100, 110, 120].map((p) => asking(p, "cfs")),
    ]);
    // eBay : 85, 68 - 102 ; CFS (×0,73) : 65,7 / 73 / 80,3 / 87,6 -> médiane 76,65, P25 71,18, P75 82,13
    expect(est?.low).toBeCloseTo((68 + 71.18) / 2, 1);
    expect(est?.high).toBeCloseTo((102 + 82.13) / 2, 1);
  });
  it("± 25 % si aucune source n'a 4 observations", () => {
    const est = aggregate([asking(100, "cfs"), asking(100, "cfs")]);
    expect([est?.low, est?.baseValue, est?.high]).toEqual([54.75, 73, 91.25]);
  });
  it("compte les observations par source", () => {
    const est = aggregate([asking(100, "ebay", 12), asking(90, "cfs"), asking(95, "cfs")]);
    expect(est?.sourceCounts).toEqual({ ebay: 12, cfs: 2 });
  });
});

describe("aggregate : confiance à points", () => {
  it("beaucoup d'annonces très dispersées : correcte, pas fiable", () => {
    expect(aggregate([{ ...asking(100, "ebay", 40), p25: 40, p75: 160 }])?.confidence).toBe("medium");
  });
  it("deux sources en désaccord d'un facteur 2 : perd un niveau", () => {
    const est = aggregate([
      { ...asking(100, "ebay", 40), p25: 92, p75: 108 },
      ...[300, 300, 300, 300].map((p) => asking(p, "cfs")),
    ]);
    // eBay 85, CFS 219 : désaccord -1, dispersion de la fourchette > 0,8 -1
    expect(est?.confidence).toBe("low");
  });
  it("deux sources concordantes et fournies : fiable", () => {
    const est = aggregate([
      { ...asking(100, "ebay", 30), p25: 92, p75: 108 },
      ...[115, 116, 117, 118].map((p) => asking(p, "cfs")),
    ]);
    expect(est?.confidence).toBe("high");
  });
});
