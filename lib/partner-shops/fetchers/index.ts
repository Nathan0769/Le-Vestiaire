import type { PartnerShop, ShopProduct } from "../types";
import { fetchShopifyProductsJson } from "./shopify-products-json";

export function fetchShopProducts(shop: PartnerShop): Promise<ShopProduct[]> {
  switch (shop.fetcher.kind) {
    case "shopify-products-json":
      return fetchShopifyProductsJson(shop.fetcher.baseUrl);
  }
}
