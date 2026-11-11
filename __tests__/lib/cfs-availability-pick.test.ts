import { describe, it, expect } from "vitest";
import {
  baseJerseyType,
  cfsChangedJerseyIds,
  clubIdForItem,
  findJerseyIds,
  isGroupedCfsTeam,
  sameCfsOffer,
  toProduct,
} from "@/lib/cfs-availability-scraper";

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
  sizeOffers: [] as { size: string; price: number; promoPrice: number | null; affiliateUrl: string }[] | null,
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

describe("isGroupedCfsTeam", () => {
  it("reconnaît les groupes qui rassemblent plusieurs clubs", () => {
    expect(["Swiss Teams", "Other Italian Clubs", "Other", "MLS Teams"].map(isGroupedCfsTeam)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("ne prend pas une équipe à son nom pour un groupe", () => {
    expect(["Servette", "Arsenal", "Other Side FC"].map(isGroupedCfsTeam)).toEqual([false, false, false]);
  });
});

describe("clubIdForItem", () => {
  const index = new Map([["servette", "club-servette"]]);

  it("prend le club de l'alias pour une équipe à son nom", () => {
    expect(clubIdForItem({ name: "Servette", clubId: "club-alias" }, "2024-25 Servette Away Shirt", index)).toBe(
      "club-alias"
    );
  });

  it("lit le club dans le nom du produit pour un groupe (Swiss Teams)", () => {
    expect(clubIdForItem({ name: "Swiss Teams" }, "2024-25 Servette Away Shirt - As New", index)).toBe(
      "club-servette"
    );
  });

  it("ignore un nom court porté par un autre club ailleurs (Andorra, Bohemians, Racing)", () => {
    const withShortNames = new Map([...index, ["andorra", "fc-andorra"], ["bohemians", "bohemians-prague"]]);
    expect(clubIdForItem({ name: "Other European National Teams" }, "2004-05 Andorra Home Shirt", withShortNames)).toBeUndefined();
    expect(clubIdForItem({ name: "Irish Teams" }, "1998-99 Bohemians Home Shirt", withShortNames)).toBeUndefined();
  });

  it("ignore un produit de groupe dont le club n'est pas au catalogue", () => {
    expect(clubIdForItem({ name: "Swiss Teams" }, "2024-25 Lugano Home Shirt", index)).toBeUndefined();
  });
});

describe("toProduct", () => {
  const item = {
    cfsId: "IP2174-SRV-A24-WTE",
    name: "2024-25 Servette Away Shirt",
    url: "https://www.classicfootballshirts.com/2024-25-servette-away-shirt.html",
    imageUrl: "https://www.classicfootballshirts.co.uk/x.jpg",
    price: 105.59,
    promoPrice: 39.59,
    priceGbp: 84.99,
    promoPriceGbp: 29.99,
    condition: "MINT" as const,
    longSleeve: false,
    sizes: ["XXL"],
    inStockSizes: ["XXL"],
  };

  it("garde une pièce disponible seulement en XXL", () => {
    expect(toProduct(item)?.promoPrice).toBe(39.59);
  });

  it("garde un produit en rupture, marqué comme tel (compté dans la cote, pas affiché)", () => {
    expect(toProduct({ ...item, inStockSizes: [] })?.inStock).toBe(false);
  });

  it("est en stock si une taille de XS à XXL l'est", () => {
    expect(toProduct({ ...item, sizes: ["M", "XXL"], inStockSizes: ["XXL"] })?.inStock).toBe(true);
  });

  it("n'est pas en stock si seule une taille 3XL ou 4XL l'est", () => {
    expect(toProduct({ ...item, sizes: ["M", "3XL"], inStockSizes: ["3XL"] })?.inStock).toBe(false);
  });

  it("garde une pièce disponible seulement en XS", () => {
    expect(toProduct({ ...item, sizes: ["XS"], inStockSizes: ["XS"] })).not.toBeNull();
  });

  it("écarte une pièce disponible seulement en 3XL ou 4XL", () => {
    expect(toProduct({ ...item, sizes: ["3XL", "4XL"] })).toBeNull();
  });
});

describe("sameCfsOffer", () => {
  it("voit un changement de lien affilié (réécriture des liens existants)", () => {
    const before = offer(true, 50);
    expect(sameCfsOffer(before, { ...before, affiliateUrl: "https://www.classicfootballshirts.co.uk/x?ref=mgi4mta" })).toBe(
      false
    );
  });

  it("voit un changement de tailles en stock", () => {
    const before = { ...offer(true, 50), sizeOffers: [{ size: "S", price: 50, promoPrice: null, affiliateUrl: "u" }] };
    expect(sameCfsOffer(before, { ...before, sizeOffers: [] })).toBe(false);
  });

  it("réécrit une offre dont les tailles n'ont jamais été écrites", () => {
    const before = { ...offer(true, 50), sizeOffers: null };
    expect(sameCfsOffer(before, { ...before, sizeOffers: [] })).toBe(false);
  });
});
