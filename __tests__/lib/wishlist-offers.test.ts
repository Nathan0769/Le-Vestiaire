import { describe, it, expect } from "vitest";
import { wishlistOfferSummary, wishlistOffers } from "@/lib/wishlist-offers";

const parc = (price: number, compareAtPrice: number | null, sizes: string[] = ["S", "L"]) => ({
  shop: "parc",
  shopName: "Le Parc à Maillots",
  price,
  compareAtPrice,
  sizes,
  url: "https://parc.test/a",
});
const cfs = (price: number, promoPrice: number | null = null) => ({ price, promoPrice, affiliateUrl: "https://cfs.test/a" });

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

  it("ignore la promo d'une boutique sans la taille voulue", () => {
    expect(wishlistOfferSummary({ cfs: cfs(90, 70), partnerOffers: [parc(65, 80)], size: "M" })).toEqual({
      status: "promo",
      savings: 20,
    });
  });
});

describe("wishlistOffers", () => {
  it("trie CFS et boutiques partenaires du moins cher au plus cher", () => {
    const offers = wishlistOffers({ cfs: cfs(90, 70), partnerOffers: [parc(65, 80)], size: null });
    expect(offers.map((o) => o.shop)).toEqual(["parc", "cfs"]);
  });

  it("prend le prix promo CFS avec le prix normal en référence", () => {
    const [offer] = wishlistOffers({ cfs: cfs(90, 70), partnerOffers: [], size: null });
    expect(offer).toMatchObject({ shop: "cfs", price: 70, compareAtPrice: 90, discount: 22 });
  });

  it("écarte une offre partenaire qui n'a pas la taille voulue", () => {
    const offers = wishlistOffers({ cfs: cfs(90, 70), partnerOffers: [parc(65, 80)], size: "M" });
    expect(offers.map((o) => o.shop)).toEqual(["cfs"]);
  });

  it("garde une offre partenaire qui a la taille voulue", () => {
    const offers = wishlistOffers({ cfs: null, partnerOffers: [parc(65, 80)], size: "L" });
    expect(offers.map((o) => o.shop)).toEqual(["parc"]);
  });

  it("accepte des prix CFS en chaîne (forme passée à la carte web)", () => {
    const [offer] = wishlistOffers({
      cfs: { price: "90.00", promoPrice: null, affiliateUrl: "u" },
      partnerOffers: [],
      size: null,
    });
    expect(offer).toMatchObject({ price: 90, compareAtPrice: null, discount: 0 });
  });

  it("renvoie une liste vide sans offre", () => {
    expect(wishlistOffers({ cfs: null, partnerOffers: [], size: null })).toEqual([]);
  });
});
