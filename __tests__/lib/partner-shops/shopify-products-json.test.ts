import { describe, it, expect, vi } from "vitest";
import {
  fetchShopifyProductsJson,
  normalizeShopifyProduct,
  PartnerFetchError,
} from "@/lib/partner-shops/fetchers/shopify-products-json";
import fixture from "../../fixtures/partner-shops/leparcamaillots-products.json";

const BASE = "https://leparcamaillots.com";
const raw = fixture.products;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("normalizeShopifyProduct", () => {
  it("normalise un produit du flux", () => {
    const p = normalizeShopifyProduct(raw[0], BASE);
    expect(p.externalId).toBe(String(raw[0].id));
    expect(p.title).toBe(raw[0].title);
    expect(p.productType).toBe("Maillot");
    expect(p.url).toBe(`${BASE}/products/${raw[0].handle}`);
    expect(p.imageUrl).toBe(raw[0].images[0].src);
    expect(p.variants[0]).toEqual({
      externalId: String(raw[0].variants[0].id),
      size: raw[0].variants[0].option1,
      price: Number(raw[0].variants[0].price),
      compareAtPrice: Number(raw[0].variants[0].compare_at_price),
      available: raw[0].variants[0].available,
    });
  });

  it("met compareAtPrice à null quand le prix barré est absent ou nul", () => {
    const base = { ...raw[0].variants[0] };
    const p = normalizeShopifyProduct(
      {
        ...raw[0],
        variants: [
          { ...base, compare_at_price: null },
          { ...base, compare_at_price: "0.00" },
        ],
      },
      BASE
    );
    expect(p.variants.map((v) => v.compareAtPrice)).toEqual([null, null]);
  });

  it("met size à null pour la variante par défaut de Shopify", () => {
    const p = normalizeShopifyProduct(
      { ...raw[0], variants: [{ ...raw[0].variants[0], option1: "Default Title" }] },
      BASE
    );
    expect(p.variants[0].size).toBeNull();
  });

  it("met imageUrl à null sans image", () => {
    expect(normalizeShopifyProduct({ ...raw[0], images: [] }, BASE).imageUrl).toBeNull();
  });
});

describe("fetchShopifyProductsJson", () => {
  it("lit toutes les pages jusqu'à la première vide", async () => {
    const page = Array.from({ length: 250 }, (_, i) => ({ ...raw[0], id: i }));
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ products: page }))
      .mockResolvedValueOnce(jsonResponse({ products: page }))
      .mockResolvedValueOnce(jsonResponse({ products: [] }));

    const products = await fetchShopifyProductsJson(BASE, fetchImpl);

    expect(products).toHaveLength(500);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls.map((c) => c[0])).toEqual([
      `${BASE}/products.json?limit=250&page=1`,
      `${BASE}/products.json?limit=250&page=2`,
      `${BASE}/products.json?limit=250&page=3`,
    ]);
  });

  it("lève PartnerFetchError sur un statut d'erreur", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("Forbidden", { status: 403 }));
    await expect(fetchShopifyProductsJson(BASE, fetchImpl)).rejects.toMatchObject({
      name: "PartnerFetchError",
      status: 403,
    });
  });

  it("lève PartnerFetchError quand la réponse n'est pas du JSON (page anti-bot)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("<!DOCTYPE html><title>Verifying your connection...</title>"));
    await expect(fetchShopifyProductsJson(BASE, fetchImpl)).rejects.toBeInstanceOf(
      PartnerFetchError
    );
  });
});
