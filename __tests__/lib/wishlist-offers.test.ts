import { describe, it, expect } from "vitest";
import { cfsOfferInput, wishlistOfferSummary, wishlistOffers } from "@/lib/wishlist-offers";

const parc = (price: number, compareAtPrice: number | null, sizes: string[] = ["S", "L"]) => ({
  shop: "parc",
  shopName: "Le Parc à Maillots",
  price,
  compareAtPrice,
  sizes,
  url: "https://parc.test/a",
});
const cfs = (price: number, promoPrice: number | null = null) => ({ price, promoPrice, affiliateUrl: "https://cfs.test/a" });

// Offre CFS par taille en stock : M 60 €, L 75 € (au lieu de 100), XL 80 €, XS et S 50 €.
const SIZE_OFFERS: Record<string, { price: number; promoPrice: number | null }> = {
  XS: { price: 50, promoPrice: null },
  S: { price: 50, promoPrice: null },
  M: { price: 60, promoPrice: null },
  L: { price: 100, promoPrice: 75 },
  XL: { price: 80, promoPrice: null },
};
const cfsSized = (inStock: string[] = ["XS", "S", "M", "L", "XL"]) => ({
  ...cfs(50),
  sizes: inStock.map((size) => ({ size, ...SIZE_OFFERS[size], affiliateUrl: `https://cfs.test/${size.toLowerCase()}` })),
});

describe("wishlistOfferSummary", () => {
  it("promo CFS dans une taille voisine seulement : comptée comme promo", () => {
    const sized = { ...cfs(50), sizes: [{ size: "M", price: 80, promoPrice: 60, affiliateUrl: "u" }] };
    expect(wishlistOfferSummary({ cfs: sized, partnerOffers: [], size: "L" })).toEqual({ status: "promo", savings: 20 });
  });

  it("maillot CFS en XS et S seulement, taille voulue L : indisponible", () => {
    expect(wishlistOfferSummary({ cfs: cfsSized(["XS", "S"]), partnerOffers: [], size: "L" })).toEqual({
      status: "unavailable",
      savings: 0,
    });
  });

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

  it("ignore la promo d'une boutique sans la taille voulue ni une taille voisine", () => {
    expect(wishlistOfferSummary({ cfs: cfs(90, 70), partnerOffers: [parc(65, 80)], size: "XXL" })).toEqual({
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

  it("écarte une offre partenaire qui n'a ni la taille voulue ni une taille voisine", () => {
    const offers = wishlistOffers({ cfs: cfs(90, 70), partnerOffers: [parc(65, 80)], size: "XXL" });
    expect(offers.map((o) => o.shop)).toEqual(["cfs"]);
  });

  it("garde une offre partenaire qui a la taille voulue", () => {
    const offers = wishlistOffers({ cfs: null, partnerOffers: [parc(65, 80)], size: "L" });
    expect(offers.map((o) => o.shop)).toEqual(["parc"]);
  });

  it("garde une offre partenaire qui a une taille voisine et la signale", () => {
    const [offer] = wishlistOffers({ cfs: null, partnerOffers: [parc(65, 80, ["M", "XL"])], size: "L" });
    expect([offer.shop, offer.otherSizes]).toEqual(["parc", ["M", "XL"]]);
  });

  it("taille voulue en stock chez CFS : prend l'offre CFS de cette taille", () => {
    const [offer] = wishlistOffers({ cfs: cfsSized(), partnerOffers: [], size: "L" });
    expect([offer.price, offer.compareAtPrice, offer.url, offer.otherSizes]).toEqual([75, 100, "https://cfs.test/l", []]);
  });

  it("écarte CFS quand le maillot n'existe qu'en XS et S et qu'on veut du L", () => {
    const offers = wishlistOffers({ cfs: cfsSized(["XS", "S"]), partnerOffers: [], size: "L" });
    expect(offers).toEqual([]);
  });

  it("taille voisine seulement chez CFS : garde l'offre voisine la moins chère et la signale", () => {
    const [offer] = wishlistOffers({ cfs: cfsSized(["M", "XL"]), partnerOffers: [], size: "L" });
    expect([offer.price, offer.otherSizes]).toEqual([60, ["M", "XL"]]);
  });

  it("tailles CFS pas encore relues : garde l'offre CFS comme avant", () => {
    const offers = wishlistOffers({ cfs: { ...cfs(90, 70), sizes: null }, partnerOffers: [], size: "L" });
    expect(offers.map((o) => o.price)).toEqual([70]);
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

describe("cfsOfferInput", () => {
  const row = {
    price: "90.00",
    promoPrice: null,
    affiliateUrl: "https://www.classicfootballshirts.co.uk/a?ref=x",
    sizeOffers: [{ size: "L", price: 80, promoPrice: 60, affiliateUrl: "https://www.classicfootballshirts.co.uk/l?ref=x" }],
  };

  it("convertit les prix et garde les tailles écrites par le cron", () => {
    const input = cfsOfferInput(row);
    expect([input.price, input.sizes?.map((s) => s.size)]).toEqual([90, ["L"]]);
  });

  it("tailles jamais écrites : null, l'offre reste comme avant", () => {
    expect(cfsOfferInput({ ...row, sizeOffers: null }).sizes).toBeNull();
  });

  it("ajoute le sous-identifiant de suivi à tous les liens, tailles comprises", () => {
    const input = cfsOfferInput(row, "wishlist-j1");
    expect([input.affiliateUrl, input.sizes![0].affiliateUrl].every((u) => u.includes("wishlist-j1"))).toBe(true);
  });
});
