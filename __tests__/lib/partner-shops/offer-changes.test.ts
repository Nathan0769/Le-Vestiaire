import { describe, it, expect } from "vitest";
import { offerChanged, type OfferState } from "@/lib/partner-shops/offer-changes";

const offer = (over: Partial<OfferState> = {}): OfferState => ({
  available: true,
  price: 59.99,
  compareAtPrice: 90,
  jerseyId: "j1",
  ...over,
});

describe("offerChanged", () => {
  it("vrai quand l'offre apparaît", () => {
    expect(offerChanged(null, offer())).toBe(true);
  });

  it("vrai quand l'offre disparaît", () => {
    expect(offerChanged(offer(), null)).toBe(true);
  });

  it("vrai quand le produit passe indisponible", () => {
    expect(offerChanged(offer(), offer({ available: false }))).toBe(true);
  });

  it("vrai quand le prix change", () => {
    expect(offerChanged(offer(), offer({ price: 49.99 }))).toBe(true);
  });

  it("vrai quand un prix barré apparaît", () => {
    expect(offerChanged(offer({ compareAtPrice: null }), offer())).toBe(true);
  });

  it("vrai quand le produit est relié à un autre maillot", () => {
    expect(offerChanged(offer(), offer({ jerseyId: "j2" }))).toBe(true);
  });

  it("faux quand rien ne change", () => {
    expect(offerChanged(offer(), offer())).toBe(false);
  });

  it("faux quand seul le prix d'un produit indisponible change (rien d'affiché)", () => {
    expect(
      offerChanged(offer({ available: false }), offer({ available: false, price: 39.99 }))
    ).toBe(false);
  });

  it("faux entre deux absences d'offre", () => {
    expect(offerChanged(null, null)).toBe(false);
  });
});
