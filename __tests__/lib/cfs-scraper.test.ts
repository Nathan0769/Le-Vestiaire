import { describe, it, expect } from "vitest";
import { selectCfsPromos, buildClearanceUrl, MIN_PROMOS_TO_REPLACE } from "@/lib/cfs-scraper";
import type { CfsRawItem } from "@/lib/cfs-constructor";

// Sans prix en livres : cfsSitePrices garde les euros de l'API, plus simple à lire.
function item(
  name: string,
  opts: { price?: number; special?: number | null; stock?: Record<string, boolean>; brand?: string } = {}
): CfsRawItem & { data: { brand?: string } } {
  const stock = opts.stock ?? { S: true, M: true, L: true };
  return {
    data: {
      id: name,
      name,
      url: `https://www.classicfootballshirts.com/${encodeURIComponent(name)}.html`,
      image_url: "https://img.example/x.jpg",
      price_eur: opts.price ?? 100,
      special_price_eur: opts.special === undefined ? 60 : opts.special,
      brand: opts.brand ?? "Nike",
    },
    variations: Object.entries(stock).map(([size, inStock]) => ({
      data: { size_product: [size], in_stock: inStock ? "1" : "0" },
    })),
  };
}

const GBP = 1.17;

describe("selectCfsPromos", () => {
  it("garde un maillot d'un club connu en promo avec 2 tailles courantes en stock", () => {
    const promos = selectCfsPromos([item("2024-25 Arsenal Home Shirt")], GBP, 20);
    expect(promos.map((p) => [p.name, p.sizes, p.discountPct])).toEqual([
      ["2024-25 Arsenal Home Shirt", ["S", "M", "L"], 40],
    ]);
  });

  it("lit le stock taille par taille : une taille épuisée n'est pas proposée", () => {
    const promos = selectCfsPromos(
      [item("2024-25 Arsenal Home Shirt", { stock: { S: false, M: true, L: true } })],
      GBP,
      20
    );
    expect(promos[0].sizes).toEqual(["M", "L"]);
  });

  it("écarte un maillot avec moins de 2 tailles S-XL en stock", () => {
    const promos = selectCfsPromos(
      [item("2024-25 Arsenal Home Shirt", { stock: { S: false, M: true, XXL: true } })],
      GBP,
      20
    );
    expect(promos).toEqual([]);
  });

  it("écarte une remise sous 20 %", () => {
    expect(selectCfsPromos([item("2024-25 Arsenal Home Shirt", { special: 85 })], GBP, 20)).toEqual([]);
  });

  it("écarte un club peu connu", () => {
    expect(selectCfsPromos([item("2024-25 Unknown Town Home Shirt")], GBP, 20)).toEqual([]);
  });

  it("écarte les maillots enfant et les training", () => {
    const promos = selectCfsPromos(
      [item("2024-25 Arsenal Home Shirt (Kids)"), item("2024-25 Arsenal Training Shirt")],
      GBP,
      20
    );
    expect(promos).toEqual([]);
  });

  it("garde au plus 2 maillots par équipe", () => {
    const promos = selectCfsPromos(
      [
        item("2024-25 Arsenal Home Shirt"),
        item("2024-25 Arsenal Away Shirt"),
        item("2024-25 Arsenal Third Shirt"),
      ],
      GBP,
      20
    );
    expect(promos).toHaveLength(2);
  });

  it("met les clubs les plus populaires en tête, puis la plus forte remise", () => {
    const promos = selectCfsPromos(
      [
        item("2024-25 Napoli Home Shirt", { special: 30 }),
        item("2024-25 Arsenal Home Shirt", { special: 70 }),
        item("2024-25 Chelsea Home Shirt", { special: 50 }),
      ],
      GBP,
      20
    );
    expect(promos.map((p) => p.name)).toEqual([
      "2024-25 Chelsea Home Shirt",
      "2024-25 Arsenal Home Shirt",
      "2024-25 Napoli Home Shirt",
    ]);
  });

  it("dédoublonne les variantes notées /10 du même maillot", () => {
    const promos = selectCfsPromos(
      [item("2024-25 Arsenal Home Shirt - 9/10"), item("2024-25 Arsenal Home Shirt - 8/10")],
      GBP,
      20
    );
    expect(promos).toHaveLength(1);
  });

  it("s'arrête à maxResults", () => {
    const promos = selectCfsPromos(
      [item("2024-25 Arsenal Home Shirt"), item("2024-25 Chelsea Home Shirt")],
      GBP,
      1
    );
    expect(promos).toHaveLength(1);
  });

  it("renvoie un lien affilié .co.uk", () => {
    const [promo] = selectCfsPromos([item("2024-25 Arsenal Home Shirt")], GBP, 20);
    expect(new URL(promo.affiliateUrl).hostname).toBe("www.classicfootballshirts.co.uk");
  });
});

describe("buildClearanceUrl", () => {
  it("demande le stock caché et filtre les maillots adultes de la liquidation", () => {
    const url = new URL(buildClearanceUrl(2));
    expect(url.pathname).toBe("/browse/department/Clearance");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("fmt_options[show_hidden_fields]")).toBe("true");
    expect(url.searchParams.getAll("filters[product_style]")).toContain("Home");
  });
});

describe("MIN_PROMOS_TO_REPLACE", () => {
  it("vaut au moins le nombre de cartes affichées sur la home", () => {
    expect(MIN_PROMOS_TO_REPLACE).toBeGreaterThanOrEqual(6);
  });
});
