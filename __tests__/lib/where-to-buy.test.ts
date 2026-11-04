import { describe, it, expect } from "vitest";
import { buildWhereToBuy, cfsClubSearchName, CFS_SEARCH_BASE_URL } from "@/lib/where-to-buy";
import type { PartnerOffer } from "@/lib/partner-shops/offers";

const parc = (price: number): PartnerOffer => ({
  shop: "leparcamaillots",
  shopName: "Le Parc à Maillots",
  logoUrl: "https://example.com/parc.png",
  itemCondition: "MINT",
  price,
  compareAtPrice: 90,
  sizes: ["M", "L"],
  url: "https://leparcamaillots.com/products/x?utm_source=levestiaire",
  promoCode: null,
});

const cfs = (price: number, promoPrice: number | null = null) => ({
  price,
  promoPrice,
  affiliateUrl: "https://www.classicfootballshirts.co.uk/x.html?ref=mgi4mta",
});

describe("buildWhereToBuy", () => {
  it("dispo au Parc seulement : un lien Parc", () => {
    const r = buildWhereToBuy({ partnerOffers: [parc(49.99)], cfs: null, cfsSearchName: null });
    expect(r).toEqual({
      kind: "offers",
      links: [
        {
          shop: "leparcamaillots",
          name: "Le Parc à Maillots",
          logoUrl: "https://example.com/parc.png",
          price: 49.99,
          compareAtPrice: 90,
          sizes: ["M", "L"],
          url: "https://leparcamaillots.com/products/x?utm_source=levestiaire",
          promoCode: null,
        },
      ],
    });
  });

  it("dispo chez CFS seulement : un lien produit CFS, prix promo et prix barré", () => {
    const r = buildWhereToBuy({ partnerOffers: [], cfs: cfs(80, 60), cfsSearchName: "Lebanon" });
    expect(r).toMatchObject({
      kind: "offers",
      links: [
        {
          shop: "cfs",
          name: "Classic Football Shirts",
          price: 60,
          compareAtPrice: 80,
          url: "https://www.classicfootballshirts.co.uk/x.html?ref=mgi4mta",
        },
      ],
    });
  });

  it("dispo chez les deux : deux liens, du moins cher au plus cher", () => {
    const r = buildWhereToBuy({ partnerOffers: [parc(49.99)], cfs: cfs(45), cfsSearchName: null });
    expect(r?.kind === "offers" && r.links.map((l) => l.shop)).toEqual(["cfs", "leparcamaillots"]);
  });

  it("dispo nulle part, nom anglais connu : recherche CFS sur ce nom", () => {
    expect(buildWhereToBuy({ partnerOffers: [], cfs: null, cfsSearchName: "Lebanon" })).toEqual({
      kind: "search",
      url: `${CFS_SEARCH_BASE_URL}&q=Lebanon`,
    });
  });

  it("encode le nom de recherche", () => {
    const r = buildWhereToBuy({ partnerOffers: [], cfs: null, cfsSearchName: "Paris Saint-Germain & co" });
    expect(r).toEqual({ kind: "search", url: `${CFS_SEARCH_BASE_URL}&q=Paris%20Saint-Germain%20%26%20co` });
  });

  it("dispo nulle part, sans nom anglais : rien", () => {
    expect(buildWhereToBuy({ partnerOffers: [], cfs: null, cfsSearchName: null })).toBeNull();
  });
});

describe("cfsClubSearchName", () => {
  it("prend le nom de l'alias CFS du club", () => {
    expect(cfsClubSearchName({ aliasName: "Manchester United", productName: "1999-00 Man Utd Home Shirt" })).toBe(
      "Manchester United"
    );
  });

  it("sans alias, lit le club dans le nom d'un produit CFS du club (groupes CFS)", () => {
    expect(cfsClubSearchName({ aliasName: null, productName: "2024-25 Servette Away Shirt - As New" })).toBe("Servette");
  });

  it("sans alias ni produit CFS, ne propose pas de recherche (elle ne trouverait rien)", () => {
    expect(cfsClubSearchName({ aliasName: null, productName: null })).toBeNull();
  });
});
