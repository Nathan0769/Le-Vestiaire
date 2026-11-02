import { describe, it, expect } from "vitest";
import { wishlistOfferSummary } from "@/lib/wishlist-offers";

const parc = (price: number, compareAtPrice: number | null) => ({ price, compareAtPrice });
const cfs = (price: number, promoPrice: number | null = null) => ({ price, promoPrice });

describe("wishlistOfferSummary", () => {
  it("promo CFS : économie = prix - prix promo", () => {
    expect(wishlistOfferSummary({ cfs: cfs(80, 60), partnerOffers: [] })).toEqual({ status: "promo", savings: 20 });
  });

  it("prix barré du Parc : compté comme une promo", () => {
    expect(wishlistOfferSummary({ cfs: null, partnerOffers: [parc(49.99, 90)] })).toEqual({
      status: "promo",
      savings: 40.01,
    });
  });

  it("deux offres en promo : économie de l'offre la moins chère", () => {
    // CFS 70 (au lieu de 80), Parc 49,99 (au lieu de 90) -> le Parc est le moins cher
    expect(wishlistOfferSummary({ cfs: cfs(80, 70), partnerOffers: [parc(49.99, 90)] })).toEqual({
      status: "promo",
      savings: 40.01,
    });
  });

  it("offre sans réduction : dispo, aucune économie", () => {
    expect(wishlistOfferSummary({ cfs: cfs(80), partnerOffers: [] })).toEqual({ status: "available", savings: 0 });
  });

  it("offre la moins chère sans réduction, une autre en promo : promo quand même", () => {
    // Parc 40 sans prix barré, CFS 60 au lieu de 80 : il existe une promo, l'économie est celle de CFS
    expect(wishlistOfferSummary({ cfs: cfs(80, 60), partnerOffers: [parc(40, null)] })).toEqual({
      status: "promo",
      savings: 20,
    });
  });

  it("aucune offre : indisponible", () => {
    expect(wishlistOfferSummary({ cfs: null, partnerOffers: [] })).toEqual({ status: "unavailable", savings: 0 });
  });
});
