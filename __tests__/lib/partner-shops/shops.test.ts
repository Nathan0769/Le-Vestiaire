import { describe, it, expect } from "vitest";
import {
  getPartnerShop,
  isAllowedImageUrl,
  isAllowedShopUrl,
} from "@/lib/partner-shops/shops";

const shop = getPartnerShop("leparcamaillots")!;

describe("getPartnerShop", () => {
  it("trouve une boutique du registre par son slug", () => {
    expect(shop.name).toBe("Le Parc à Maillots");
  });

  it("renvoie undefined pour un slug inconnu", () => {
    expect(getPartnerShop("inconnue")).toBeUndefined();
  });
});

describe("isAllowedShopUrl", () => {
  it("accepte une URL https du domaine de la boutique", () => {
    expect(isAllowedShopUrl(shop, "https://leparcamaillots.com/products/x")).toBe(true);
  });

  it("accepte un sous-domaine", () => {
    expect(isAllowedShopUrl(shop, "https://www.leparcamaillots.com/products/x")).toBe(true);
  });

  it("refuse le http", () => {
    expect(isAllowedShopUrl(shop, "http://leparcamaillots.com/products/x")).toBe(false);
  });

  it("refuse un autre domaine qui cite celui de la boutique dans le chemin", () => {
    expect(isAllowedShopUrl(shop, "https://evil.com/leparcamaillots.com")).toBe(false);
  });

  it("refuse un domaine qui commence comme celui de la boutique", () => {
    expect(isAllowedShopUrl(shop, "https://leparcamaillots.com.evil.com/x")).toBe(false);
  });

  it("refuse une chaîne qui n'est pas une URL", () => {
    expect(isAllowedShopUrl(shop, "javascript:alert(1)")).toBe(false);
  });
});

describe("isAllowedImageUrl", () => {
  it("accepte le CDN Shopify", () => {
    expect(isAllowedImageUrl(shop, "https://cdn.shopify.com/s/files/1/x.jpg")).toBe(true);
  });

  it("refuse un domaine tiers", () => {
    expect(isAllowedImageUrl(shop, "https://evil.com/x.jpg")).toBe(false);
  });
});

describe("productLink", () => {
  it("ajoute le tracking Le Vestiaire à l'URL produit", () => {
    expect(shop.productLink("https://leparcamaillots.com/products/x")).toBe(
      "https://leparcamaillots.com/products/x?utm_source=levestiaire&utm_medium=referral"
    );
  });
});
