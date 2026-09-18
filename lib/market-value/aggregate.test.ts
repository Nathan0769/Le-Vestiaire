import { describe, it, expect } from "vitest";
import { aggregate, valueForCondition, valueForItem } from "./aggregate";
import type { PriceSignal } from "./types";

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

  it("abat un prix demandé CFS (asking→sold, facteur 0.8)", () => {
    const est = aggregate([asking(100, "cfs")]);
    expect(est?.baseValue).toBe(80);
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

  it("prend une médiane pondérée (eBay pèse plus que le CFS)", () => {
    const est = aggregate([asking(80, "ebay"), asking(120, "ebay"), asking(200, "cfs")]);
    // normalisés: 68 (w1), 102 (w1), 160 (w0.5) → médiane pondérée = 102
    expect(est?.baseValue).toBe(102);
  });

  it("confiance HAUTE dès qu'une source agrège beaucoup d'annonces", () => {
    // 1 seul signal eBay mais 40 annonces réelles -> haute confiance.
    const est = aggregate([asking(50, "ebay", 40)]);
    expect(est?.confidence).toBe("high");
    expect(est?.sampleSize).toBe(40);
  });

  it("confiance moyenne autour de 8-19 observations", () => {
    expect(aggregate([asking(50, "ebay", 10)])?.confidence).toBe("medium");
  });

  it("palier moyen dès 4 observations si 2 sources concordent", () => {
    const est = aggregate([asking(50, "ebay", 3), asking(60, "cfs", 1)]);
    // 4 observations + 2 sources -> medium
    expect(est?.confidence).toBe("medium");
  });

  it("confiance faible en dessous de 8 observations, source unique", () => {
    expect(aggregate([asking(50, "ebay", 2)])?.confidence).toBe("low");
    expect(aggregate([asking(50, "cfs", 1)])?.confidence).toBe("low");
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
  it("premium manches longues et signé", () => {
    // GOOD × replica × manches 1.1 × signé 1.4 = 154
    expect(valueForItem(100, { condition: "GOOD", hasLongSleeves: true, isSigned: true })).toBe(154);
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
