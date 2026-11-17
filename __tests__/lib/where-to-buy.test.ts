import { describe, it, expect } from "vitest";
import { buildWhereToBuy, cheapestCfsOffer, cheapestCfsOfferByClub } from "@/lib/where-to-buy";
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
    const r = buildWhereToBuy({ partnerOffers: [parc(49.99)], cfs: null, cfsClubOffer: null });
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
    const r = buildWhereToBuy({ partnerOffers: [], cfs: cfs(80, 60), cfsClubOffer: null });
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
    const r = buildWhereToBuy({ partnerOffers: [parc(49.99)], cfs: cfs(45), cfsClubOffer: null });
    expect(r?.kind === "offers" && r.links.map((l) => l.shop)).toEqual(["cfs", "leparcamaillots"]);
  });

  it("marque l'offre CFS de son emplacement", () => {
    const r = buildWhereToBuy({
      partnerOffers: [],
      cfs: cfs(80),
      cfsClubOffer: null,
      subIds: { offer: "fiche-j1", club: "club-c1" },
    });
    const link = r?.kind === "offers" ? r.links[0].url : "";
    expect(new URL(link).searchParams.get("tm_subid")).toBe("fiche-j1");
  });

  it("dispo nulle part : lien vers le maillot CFS le moins cher du club, au prix promo", () => {
    expect(buildWhereToBuy({ partnerOffers: [], cfs: null, cfsClubOffer: cfs(80, 55) })).toEqual({
      kind: "club",
      price: 55,
      url: "https://www.classicfootballshirts.co.uk/x.html?ref=mgi4mta",
    });
  });

  it("marque le lien vers un autre maillot du club de son emplacement", () => {
    const r = buildWhereToBuy({
      partnerOffers: [],
      cfs: null,
      cfsClubOffer: cfs(80),
      subIds: { offer: "fiche-j1", club: "club-c1" },
    });
    expect(new URL(r?.kind === "club" ? r.url : "").searchParams.get("tm_subid")).toBe("club-c1");
  });

  it("dispo nulle part, aucun maillot du club chez CFS : rien", () => {
    expect(buildWhereToBuy({ partnerOffers: [], cfs: null, cfsClubOffer: null })).toBeNull();
  });
});

describe("cheapestCfsOffer", () => {
  it("compare le prix promo des uns au prix normal des autres", () => {
    const promo = { ...cfs(90, 60), affiliateUrl: "https://a" };
    const normal = { ...cfs(50), affiliateUrl: "https://b" };
    expect(cheapestCfsOffer([promo, normal])?.affiliateUrl).toBe("https://b");
  });

  it("sans offre : null", () => {
    expect(cheapestCfsOffer([null, null])).toBeNull();
  });
});

describe("cheapestCfsOfferByClub", () => {
  it("garde par club l'offre la moins chère, promo comprise", () => {
    const rows = [
      { clubId: "psg", ...cfs(90, 60), affiliateUrl: "https://psg-promo" },
      { clubId: "psg", ...cfs(70), affiliateUrl: "https://psg-normal" },
      { clubId: "om", ...cfs(80), affiliateUrl: "https://om" },
    ];
    const byClub = cheapestCfsOfferByClub(rows);
    expect(byClub.get("psg")?.affiliateUrl).toBe("https://psg-promo");
    expect(byClub.get("om")?.affiliateUrl).toBe("https://om");
  });

  it("club sans ligne : absent", () => {
    expect(cheapestCfsOfferByClub([]).has("psg")).toBe(false);
  });
});
