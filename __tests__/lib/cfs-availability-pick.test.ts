import { describe, it, expect } from "vitest";
import { baseJerseyType, cfsChangedJerseyIds, findJerseyIds, pickCfsOffer } from "@/lib/cfs-availability-scraper";

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

describe("findJerseyIds", () => {
  const index = new Map([
    ["liverpool|2024-25|HOME", "lfc-2425"],
    ["liverpool|2008-09|HOME", "lfc-0809"],
    ["liverpool|2009-10|HOME", "lfc-0910"],
    ["liverpool|2018-19|HOME", "lfc-1819"],
    ["allemagne|2022|HOME", "ger-2022"],
    ["allemagne|1990|AWAY", "ger-1990"],
  ]);

  it("trouve la saison exacte", () => {
    expect(findJerseyIds(index, "liverpool", "2024-25", ["HOME"])).toEqual(["lfc-2425"]);
  });

  it("relie un maillot porté deux saisons aux deux fiches", () => {
    expect(findJerseyIds(index, "liverpool", "2008-10", ["HOME"])).toEqual(["lfc-0809", "lfc-0910"]);
  });

  it("se replie sur l'année de début quand le catalogue range le maillot par année (sélections)", () => {
    expect(findJerseyIds(index, "allemagne", "2022-23", ["HOME"])).toEqual(["ger-2022"]);
    expect(findJerseyIds(index, "allemagne", "1990-92", ["AWAY"])).toEqual(["ger-1990"]);
  });

  it("relie un maillot de sélection porté sur deux ans à l'année du catalogue", () => {
    const nations = new Map([["angleterre|2006|HOME", "eng-2006"], ["angleterre|2010|HOME", "eng-2010"]]);
    expect(findJerseyIds(nations, "angleterre", "2005-07", ["HOME"])).toEqual(["eng-2006"]);
    expect(findJerseyIds(nations, "angleterre", "2009-10", ["HOME"])).toEqual(["eng-2010"]);
  });

  it("se rabat sur le type de base pour une version spéciale absente du catalogue", () => {
    expect(findJerseyIds(index, "liverpool", "2018-19", ["CHAMPION", "HOME"])).toEqual(["lfc-1819"]);
  });

  it("renvoie une liste vide sans maillot", () => {
    expect(findJerseyIds(index, "liverpool", "1999-00", ["HOME"])).toEqual([]);
  });
});

describe("baseJerseyType", () => {
  it.each([
    ["2018-19 Liverpool 'CL Winners' Home Shirt M.Salah #11 (L)", "HOME"],
    ["2002-03 Real Madrid Centenary Away Shirt", "AWAY"],
    ["2020-21 Arsenal Third Shirt", "THIRD"],
    ["2001-03 Liverpool CL Shirt (XL)", null],
  ])("%s -> %s", (name, type) => {
    expect(baseJerseyType(name)).toBe(type);
  });
});
