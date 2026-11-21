import { describe, it, expect } from "vitest";
import { collectionHistory, valueItem, type ValuationContext, type ValuedItem } from "./collection-valuation";

const rates = { EUR: 1, GBP: 1.15 };
const item = (over: Partial<ValuedItem> = {}): ValuedItem => ({
  jerseyId: "j1",
  condition: "GOOD",
  version: "REPLICA",
  hasLongSleeves: false,
  isSigned: false,
  purchasePrice: null,
  purchaseCurrency: "EUR",
  ...over,
});
const ctx = (over: Partial<ValuationContext> = {}): ValuationContext => ({
  marketBase: new Map(),
  marketConfidence: new Map(),
  siteAverageBuy: new Map(),
  rates,
  ...over,
});

describe("valueItem", () => {
  it("une réédition vaut son prix d'achat, jamais la cote", () => {
    const v = valueItem(item({ version: "REISSUE", purchasePrice: 60 }), ctx({ marketBase: new Map([["j1", 200]]) }));
    expect(v).toEqual({ value: 60, source: "purchase", confidence: null });
  });

  it("avec une cote : valeur de l'exemplaire (état, version...)", () => {
    const v = valueItem(item({ condition: "MINT" }), ctx({ marketBase: new Map([["j1", 40]]), marketConfidence: new Map([["j1", "high"]]) }));
    expect(v).toEqual({ value: 50, source: "market", confidence: "high" });
  });

  it("sans cote : son prix d'achat, converti en EUR", () => {
    expect(valueItem(item({ purchasePrice: 40, purchaseCurrency: "GBP" }), ctx()).value).toBe(46);
  });

  it("sans cote ni prix : la moyenne des achats du site", () => {
    expect(valueItem(item(), ctx({ siteAverageBuy: new Map([["j1", 35]]) }))).toEqual({
      value: 35,
      source: "purchase",
      confidence: null,
    });
  });

  it("rien : inconnu", () => {
    expect(valueItem(item(), ctx())).toEqual({ value: null, source: "unknown", confidence: null });
  });
});

describe("collectionHistory", () => {
  const day = (d: string) => new Date(`${d}T12:00:00Z`);

  it("le dernier point égale la valeur actuelle de la collection, maillots sans cote compris", () => {
    const items = [
      { ...item({ jerseyId: "a" }), since: day("2026-11-01") },
      { ...item({ jerseyId: "b", purchasePrice: 30 }), since: day("2026-11-01") },
    ];
    const points = collectionHistory(items, {
      snapshots: new Map([["a", [{ value: 40, time: day("2026-11-02").getTime(), methodVersion: 2 }]]]),
      ctx: ctx({ marketBase: new Map([["a", 42]]) }),
      today: "2026-11-21",
    });
    // a : 42 (cote actuelle), b : 30 (prix d'achat)
    expect(points.at(-1)).toEqual({ date: "2026-11-21", value: 72 });
  });

  it("un maillot entre dans la courbe à sa date d'achat, à son prix tant qu'il n'a pas de cote", () => {
    const items = [{ ...item({ jerseyId: "a", purchasePrice: 50 }), since: day("2026-11-05") }];
    const points = collectionHistory(items, {
      snapshots: new Map([["a", [{ value: 40, time: day("2026-11-10").getTime(), methodVersion: 2 }]]]),
      ctx: ctx({ marketBase: new Map([["a", 40]]) }),
      today: "2026-11-21",
    });
    expect(points).toEqual([
      { date: "2026-11-05", value: 50 },
      { date: "2026-11-10", value: 40 },
      { date: "2026-11-21", value: 40 },
    ]);
  });

  it("raccorde l'ancienne méthode au lieu de dessiner une marche", () => {
    const items = [{ ...item({ jerseyId: "a" }), since: day("2026-10-01") }];
    const points = collectionHistory(items, {
      snapshots: new Map([
        [
          "a",
          [
            { value: 60, time: day("2026-10-01").getTime(), methodVersion: 1 },
            { value: 36, time: day("2026-11-22").getTime(), methodVersion: 2 },
          ],
        ],
      ]),
      ctx: ctx({ marketBase: new Map([["a", 36]]) }),
      today: "2026-11-23",
    });
    expect(points.map((p) => p.value)).toEqual([36, 36, 36]);
  });
});
