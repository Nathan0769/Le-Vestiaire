import { describe, it, expect } from "vitest";
import { buildJerseyMetaPrice } from "@/lib/jersey-meta-price";
import type { WhereToBuyLink } from "@/lib/where-to-buy";

const plain = (s: string) => s.replace(/ | /g, " ");

const link = (price: number, compareAtPrice: number | null = null): WhereToBuyLink => ({
  shop: "cfs",
  name: "Classic Football Shirts",
  logoUrl: "",
  price,
  compareAtPrice,
  sizes: [],
  url: "https://example.com",
  promoCode: null,
});

describe("buildJerseyMetaPrice", () => {
  it("ne renvoie rien sans offre", () => {
    expect(buildJerseyMetaPrice(null, "fr")).toBeNull();
  });

  it("ignore le repli sur un autre maillot du club", () => {
    expect(buildJerseyMetaPrice({ kind: "club", url: "https://example.com", price: 20 }, "fr")).toBeNull();
  });

  it("prend le prix le plus bas, formaté selon la langue", () => {
    const meta = buildJerseyMetaPrice({ kind: "offers", links: [link(35.99), link(49)] }, "fr");
    expect(meta && plain(meta.price)).toBe("35,99 €");
    expect(meta?.discountPercent).toBeNull();
  });

  it("formate le prix en anglais", () => {
    const meta = buildJerseyMetaPrice({ kind: "offers", links: [link(35.99)] }, "en");
    expect(meta?.price).toBe("€35.99");
  });

  it("donne la remise arrondie de l'offre la moins chère en promo", () => {
    const meta = buildJerseyMetaPrice({ kind: "offers", links: [link(25.99, 99.99), link(30)] }, "fr");
    expect(meta?.discountPercent).toBe(74);
  });

  it("n'annonce pas de remise inférieure à 1 %", () => {
    const meta = buildJerseyMetaPrice({ kind: "offers", links: [link(99.8, 100)] }, "fr");
    expect(meta?.discountPercent).toBeNull();
  });
});
