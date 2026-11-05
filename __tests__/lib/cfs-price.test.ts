import { describe, it, expect } from "vitest";
import { cfsSitePriceEur, cfsSitePrices } from "@/lib/cfs-price";

// Prix en euros relevés sur le site CFS le 2026-11-05, taux BCE du jour 1,1982.
const GBP_TO_EUR = 1.1982;

describe("cfsSitePriceEur", () => {
  it("retrouve le prix en euros affiché par CFS à partir du prix en livres", () => {
    expect(cfsSitePriceEur(29.99, GBP_TO_EUR)).toBe(36.99);
    expect(cfsSitePriceEur(89.99, GBP_TO_EUR)).toBe(109.99);
    expect(cfsSitePriceEur(124.99, GBP_TO_EUR)).toBe(151.99);
  });
});

describe("cfsSitePrices", () => {
  it("convertit prix et promo en livres", () => {
    expect(
      cfsSitePrices({ price: 105.59, promoPrice: 39.59, priceGbp: 84.99, promoPriceGbp: 29.99 }, GBP_TO_EUR)
    ).toEqual({ price: 102.99, promoPrice: 36.99 });
  });

  it("garde une promo nulle", () => {
    expect(
      cfsSitePrices({ price: 96.79, promoPrice: null, priceGbp: 89.99, promoPriceGbp: null }, GBP_TO_EUR)
    ).toEqual({ price: 109.99, promoPrice: null });
  });

  it("garde le prix en euros de l'API sans prix en livres", () => {
    expect(cfsSitePrices({ price: 80, promoPrice: 60, priceGbp: null, promoPriceGbp: null }, GBP_TO_EUR)).toEqual({
      price: 80,
      promoPrice: 60,
    });
  });
});
