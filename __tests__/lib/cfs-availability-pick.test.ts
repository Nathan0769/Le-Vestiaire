import { describe, it, expect } from "vitest";
import { cfsChangedJerseyIds, pickCfsOffer } from "@/lib/cfs-availability-scraper";

const offer = (isReference: boolean, price = 50) => ({
  price,
  promoPrice: null,
  productUrl: `https://example.com/${price}`,
  affiliateUrl: `https://example.com/${price}?ref=x`,
  imageUrl: "https://example.com/x.jpg",
  isReference,
});

describe("pickCfsOffer", () => {
  it("prend le candidat quand il n'y a encore rien", () => {
    expect(pickCfsOffer(undefined, offer(false))).toEqual(offer(false));
  });

  it("garde une offre de référence face à une version pro ou manches longues", () => {
    expect(pickCfsOffer(offer(true, 50), offer(false, 90))).toEqual(offer(true, 50));
  });

  it("remplace une offre hors référence par une offre de référence", () => {
    expect(pickCfsOffer(offer(false, 90), offer(true, 50))).toEqual(offer(true, 50));
  });

  it("à référence égale, le dernier produit l'emporte (comportement historique)", () => {
    expect(pickCfsOffer(offer(true, 50), offer(true, 60))).toEqual(offer(true, 60));
  });
});

describe("cfsChangedJerseyIds", () => {
  const row = (price: number, promoPrice: number | null = null, affiliateUrl = "https://example.com/a") => ({
    price,
    promoPrice,
    affiliateUrl,
  });

  it("signale les dispos apparues, modifiées et purgées, pas les inchangées", () => {
    const before = new Map([
      ["same", row(50)],
      ["price", row(50)],
      ["promo", row(50)],
      ["url", row(50)],
      ["gone", row(50)],
    ]);
    const after = new Map([
      ["same", row(50)],
      ["price", row(45)],
      ["promo", row(50, 40)],
      ["url", row(50, null, "https://example.com/b")],
      ["new", row(60)],
    ]);

    expect(cfsChangedJerseyIds(before, after, ["gone"]).sort()).toEqual(
      ["gone", "new", "price", "promo", "url"].sort()
    );
  });
});
