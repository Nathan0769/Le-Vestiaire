import { describe, it, expect } from "vitest";
import { cfsChangedJerseyIds, findJerseyId, pickCfsOffer } from "@/lib/cfs-availability-scraper";

const offer = (
  isReference: boolean,
  price = 50,
  condition: "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | null = null
) => ({
  price,
  promoPrice: null,
  productUrl: `https://example.com/${price}`,
  affiliateUrl: `https://example.com/${price}?ref=x`,
  imageUrl: "https://example.com/x.jpg",
  isReference,
  condition,
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

  it("à référence égale, garde le meilleur état", () => {
    expect(pickCfsOffer(offer(true, 50, "MINT"), offer(true, 40, "GOOD"))).toEqual(offer(true, 50, "MINT"));
    expect(pickCfsOffer(offer(true, 40, "FAIR"), offer(true, 50, "EXCELLENT"))).toEqual(offer(true, 50, "EXCELLENT"));
  });

  it("un état connu passe devant un état non précisé", () => {
    expect(pickCfsOffer(offer(true, 50, null), offer(true, 60, "GOOD"))).toEqual(offer(true, 60, "GOOD"));
  });

  it("à référence et état égaux, le dernier produit l'emporte (comportement historique)", () => {
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

describe("findJerseyId", () => {
  const index = new Map([
    ["liverpool|2024-25|HOME", "lfc-2425"],
    ["allemagne|2022|HOME", "ger-2022"],
    ["allemagne|1990|AWAY", "ger-1990"],
  ]);

  it("trouve la saison exacte", () => {
    expect(findJerseyId(index, "liverpool", "2024-25", "HOME")).toBe("lfc-2425");
  });

  it("se replie sur l'année de début quand le catalogue range le maillot par année (sélections)", () => {
    expect(findJerseyId(index, "allemagne", "2022-23", "HOME")).toBe("ger-2022");
    expect(findJerseyId(index, "allemagne", "1990-92", "AWAY")).toBe("ger-1990");
  });

  it("renvoie null sans maillot", () => {
    expect(findJerseyId(index, "liverpool", "1999-00", "HOME")).toBeNull();
  });
});
