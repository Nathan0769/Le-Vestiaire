import { describe, it, expect } from "vitest";
import { aggregate, valueForCondition } from "./aggregate";
import type { PriceSignal } from "./types";

const sold = (price: number, source: PriceSignal["source"] = "purchasePrice", condition?: PriceSignal["condition"]): PriceSignal => ({
  price,
  type: "sold",
  source,
  condition,
});
const asking = (price: number, source: PriceSignal["source"] = "cfs"): PriceSignal => ({
  price,
  type: "asking",
  source,
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

  it("garde un prix de vente tel quel", () => {
    expect(aggregate([sold(100)])?.baseValue).toBe(100);
  });

  it("normalise un signal MINT vers l'état de référence (GOOD)", () => {
    // 125 pour MINT → base GOOD = 125 / 1.25 = 100
    expect(aggregate([sold(125, "purchasePrice", "MINT")])?.baseValue).toBe(100);
  });

  it("prend une médiane pondérée (les ventes pèsent plus que le CFS)", () => {
    const est = aggregate([sold(80), sold(120), asking(200, "cfs")]);
    // normalisés: 80 (w1), 120 (w1), 160 (w0.5) → médiane pondérée = 120
    expect(est?.baseValue).toBe(120);
  });

  it("confiance haute si >=5 signaux et >=2 sources", () => {
    const est = aggregate([
      sold(100), sold(110), sold(90), sold(105), sold(95), asking(150, "cfs"),
    ]);
    expect(est?.confidence).toBe("high");
    expect(est?.sampleSize).toBe(6);
  });

  it("confiance moyenne pour 3-4 signaux", () => {
    expect(aggregate([sold(100), sold(110), sold(90)])?.confidence).toBe("medium");
  });

  it("confiance faible pour 1-2 signaux", () => {
    expect(aggregate([sold(100), sold(110)])?.confidence).toBe("low");
  });
});

describe("valueForCondition", () => {
  it("applique le multiplicateur d'état", () => {
    expect(valueForCondition(100, "MINT")).toBe(125);
    expect(valueForCondition(100, "GOOD")).toBe(100);
    expect(valueForCondition(100, "POOR")).toBe(60);
  });
});
