import { describe, it, expect } from "vitest";
import {
  nextCfsProductState,
  pickDisplayedOffer,
  toCfsSignals,
  type CfsProductState,
} from "@/lib/cfs-products";

const now = new Date("2026-11-03T02:40:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

const seen = (over: Partial<CfsProductState> = {}) => ({
  name: "2024-25 Servette Away Shirt",
  price: 105.59,
  promoPrice: 39.59 as number | null,
  inStock: true,
  isReference: true,
  condition: "MINT" as const,
  productUrl: "https://www.classicfootballshirts.com/servette.html",
  imageUrl: "https://www.classicfootballshirts.co.uk/servette.jpg",
  ...over,
});

const stored = (over: Partial<CfsProductState> = {}): CfsProductState => ({
  ...seen(),
  soldAt: null,
  soldPrice: null,
  ...over,
});

describe("nextCfsProductState", () => {
  it("ne déduit pas de vente pour un nouveau produit en stock", () => {
    const next = nextCfsProductState(undefined, seen(), now);
    expect([next.changed, next.sale, next.state.soldAt]).toEqual([true, false, null]);
  });

  it("ne déduit pas de vente pour un produit déjà en rupture à sa première apparition", () => {
    const next = nextCfsProductState(undefined, seen({ inStock: false }), now);
    expect([next.sale, next.state.soldAt]).toEqual([false, null]);
  });

  it("déduit une vente au prix affiché quand le produit passe en rupture", () => {
    const next = nextCfsProductState(stored(), seen({ inStock: false }), now);
    expect([next.sale, next.state.soldAt, next.state.soldPrice]).toEqual([true, now, 39.59]);
  });

  it("prend le prix normal comme prix de vente sans promo", () => {
    const next = nextCfsProductState(stored({ promoPrice: null }), seen({ inStock: false, promoPrice: null }), now);
    expect(next.state.soldPrice).toBe(105.59);
  });

  it("annule la vente si le produit revient en stock sous 48 h", () => {
    const sold = stored({ inStock: false, soldAt: hoursAgo(24), soldPrice: 39.59 });
    const next = nextCfsProductState(sold, seen(), now);
    expect([next.cancelled, next.state.soldAt, next.state.soldPrice]).toEqual([true, null, null]);
  });

  it("garde la vente si le produit revient en stock après 48 h (nouvel exemplaire)", () => {
    const sold = stored({ inStock: false, soldAt: hoursAgo(72), soldPrice: 39.59 });
    const next = nextCfsProductState(sold, seen(), now);
    expect([next.cancelled, next.state.soldAt]).toEqual([false, hoursAgo(72)]);
  });

  it("signale l'absence de changement", () => {
    expect(nextCfsProductState(stored(), seen(), now).changed).toBe(false);
  });

  it("signale un changement de prix", () => {
    expect(nextCfsProductState(stored(), seen({ promoPrice: 29.99 }), now).changed).toBe(true);
  });
});

describe("pickDisplayedOffer", () => {
  const product = (over: Partial<CfsProductState>) => stored({ promoPrice: null, ...over });

  it("ignore les produits en rupture", () => {
    expect(pickDisplayedOffer([product({ inStock: false, price: 20 })])).toBeNull();
  });

  it("prend le produit en stock le moins cher, promo comprise", () => {
    const cheapPromo = product({ price: 90, promoPrice: 40, productUrl: "a" });
    const offer = pickDisplayedOffer([product({ price: 50, productUrl: "b" }), cheapPromo]);
    expect(offer?.productUrl).toBe("a");
  });

  it("à prix égal, préfère le maillot de référence puis le meilleur état", () => {
    const offer = pickDisplayedOffer([
      product({ price: 50, isReference: false, condition: "MINT", productUrl: "pro" }),
      product({ price: 50, condition: "GOOD", productUrl: "good" }),
      product({ price: 50, condition: "EXCELLENT", productUrl: "excellent" }),
    ]);
    expect(offer?.productUrl).toBe("excellent");
  });
});

describe("toCfsSignals", () => {
  const row = (over: Partial<CfsProductState> = {}) => ({ ...stored(), lastSeenAt: now, ...over });

  it("donne un prix demandé par produit de référence, ruptures comprises", () => {
    const signals = toCfsSignals([row(), row({ inStock: false, price: 80 })], now);
    expect(signals.map((s) => [s.type, s.price])).toEqual([
      ["asking", 105.59],
      ["asking", 80],
    ]);
  });

  it("écarte les produits hors référence et sans prix", () => {
    expect(toCfsSignals([row({ isReference: false }), row({ price: 0 })], now)).toEqual([]);
  });

  it("compte une vente récente comme vente, sans prix demandé en double", () => {
    const signals = toCfsSignals([row({ inStock: false, soldAt: hoursAgo(240), soldPrice: 39.59 })], now);
    expect(signals).toEqual([
      { price: 39.59, type: "sold", source: "cfs", condition: "MINT", date: hoursAgo(240) },
    ]);
  });

  it("repasse une vente de plus de 180 jours en prix demandé", () => {
    const signals = toCfsSignals([row({ inStock: false, soldAt: hoursAgo(181 * 24), soldPrice: 39.59 })], now);
    expect(signals.map((s) => s.type)).toEqual(["asking"]);
  });
});
