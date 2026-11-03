import { describe, it, expect, vi } from "vitest";
import {
  buildBrowseUrl,
  fetchCfsTeams,
  CFS_API_KEY,
  fetchTeamProducts,
  isAllowedCfsUrl,
  mapCfsCondition,
  normalizeCfsItem,
  PAGE_CAP,
  type CfsRawItem,
} from "@/lib/cfs-constructor";
import fixture from "../fixtures/cfs/liverpool-home-page1.json";

const rows = fixture.response.results as CfsRawItem[];

function page(results: CfsRawItem[]): Response {
  return new Response(JSON.stringify({ response: { results, total_num_results: results.length } }), {
    headers: { "content-type": "application/json" },
  });
}

describe("buildBrowseUrl", () => {
  it("encode l'équipe et applique les filtres utiles", () => {
    const url = new URL(buildBrowseUrl({ team: "Manchester United", style: "Home", page: 2 }));
    expect(url.pathname).toBe("/browse/team/Manchester%20United");
    expect(url.searchParams.get("key")).toBe(CFS_API_KEY);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("num_results_per_page")).toBe("200");
    expect(url.searchParams.getAll("filters[product_style]")).toEqual(["Home"]);
    expect(url.searchParams.getAll("filters[size_product]")).toEqual(["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"]);
    expect(url.searchParams.getAll("filters[department]")).toEqual(["Classic", "Clearance", "Current Season", "Own Brand"]);
    expect(url.searchParams.has("filters[era]")).toBe(false);
  });

  it("ajoute l'époque quand elle est fournie", () => {
    const url = new URL(buildBrowseUrl({ team: "Liverpool", style: "Home", era: "1990s", page: 1 }));
    expect(url.searchParams.getAll("filters[era]")).toEqual(["1990s"]);
  });
});

describe("normalizeCfsItem", () => {
  it("lit nom, lien, prix, état, manches et tailles d'un produit neuf à plusieurs tailles", () => {
    const raw = rows.find((r) => r.variations?.length)!;
    const item = normalizeCfsItem(raw);
    expect(item.name).toBe(raw.data.name);
    expect(item.url).toBe(raw.data.url);
    expect(item.price).toBe(raw.data.price_eur);
    expect(item.sizes.length).toBeGreaterThan(1);
    expect(item.sizes).toEqual(expect.arrayContaining(["L", "S"]));
    expect(item.longSleeve).toBe(raw.data.sleeve_length === "Long-Sleeve");
  });

  it("met le prix promo à null quand il n'est pas inférieur au prix", () => {
    const item = normalizeCfsItem({
      data: { ...rows[0].data, price_eur: 80, special_price_eur: 80 },
    });
    expect(item.promoPrice).toBeNull();
  });

  it("ne garde que les tailles adultes d'une pièce unique", () => {
    const item = normalizeCfsItem({ data: { ...rows[0].data, size_product: ["13-14Y"] } });
    expect(item.sizes).toEqual([]);
  });
});

describe("mapCfsCondition", () => {
  it.each([
    ["Brand New", "MINT"],
    ["Mint", "MINT"],
    ["Excellent", "EXCELLENT"],
    ["Very Good", "GOOD"],
    ["Good", "GOOD"],
    ["Fair", "FAIR"],
    ["Unspecified", null],
    [undefined, null],
  ])("%s -> %s", (prodcat, condition) => {
    expect(mapCfsCondition(prodcat)).toBe(condition);
  });
});

describe("isAllowedCfsUrl", () => {
  // L'API renvoie le site international (.com) ; l'ancien index renvoyait le .co.uk.
  it.each([
    "https://www.classicfootballshirts.com/2012-13-liverpool-home-shirt-suarez-7-livh127v.html",
    "https://www.classicfootballshirts.co.uk/2024-25-liverpool-home-shirt.html",
  ])("accepte une fiche produit CFS en https : %s", (url) => {
    expect(isAllowedCfsUrl(url)).toBe(true);
  });

  it("accepte les liens produit réels renvoyés par l'API", () => {
    expect(rows.every((r) => isAllowedCfsUrl(r.data.url))).toBe(true);
  });
  it.each([
    "http://www.classicfootballshirts.co.uk/x.html",
    "https://evil.com/classicfootballshirts.co.uk",
    "https://classicfootballshirts.com.evil.com/x.html",
    "pas une url",
  ])(
    "refuse %s",
    (url) => {
      expect(isAllowedCfsUrl(url)).toBe(false);
    }
  );
});

describe("fetchTeamProducts", () => {
  it("interroge chaque type de maillot et s'arrête sur une page incomplète", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => page(rows.slice(0, 3)));
    const items = await fetchTeamProducts("Liverpool", fetchImpl);

    const styles = fetchImpl.mock.calls.map(([u]) => new URL(u as string).searchParams.get("filters[product_style]"));
    expect(styles).toEqual(["Home", "Away", "Third", "Fourth", "GK"]);
    // Même produit renvoyé pour chaque type : dédoublonné par lien.
    expect(items).toHaveLength(3);
  });

  it("redécoupe par époque une tranche qui atteint le plafond de l'API", async () => {
    const full = Array.from({ length: 200 }, (_, i) => ({ data: { ...rows[0].data, url: `https://www.classicfootballshirts.co.uk/p${i}.html` } }));
    const fetchImpl = vi.fn().mockImplementation(async (u: string) => {
      const params = new URL(u).searchParams;
      const style = params.get("filters[product_style]");
      const pageNo = Number(params.get("page"));
      if (style !== "Home") return page([]);
      // Sans époque : pages pleines jusqu'au plafond -> tranche saturée.
      if (!params.has("filters[era]")) return page(pageNo * 200 <= PAGE_CAP ? full : []);
      return page(params.get("filters[era]") === "1990s" && pageNo === 1 ? full.slice(0, 5) : []);
    });

    const items = await fetchTeamProducts("Liverpool", fetchImpl);

    const eras = fetchImpl.mock.calls
      .map(([u]) => new URL(u as string).searchParams.get("filters[era]"))
      .filter(Boolean);
    expect(new Set(eras).size).toBeGreaterThan(1);
    expect(items).toHaveLength(200);
  });
});

describe("fetchCfsTeams", () => {
  it("lit la liste complète des équipes (facet_options, sans le plafond de 500)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response: {
            facets: [
              {
                name: "team",
                options: [
                  { value: "Manchester United", count: 33400 },
                  { value: "Madureira", count: 1 },
                ],
              },
            ],
          },
        })
      )
    );

    expect(await fetchCfsTeams(fetchImpl)).toEqual([
      { name: "Manchester United", count: 33400 },
      { name: "Madureira", count: 1 },
    ]);
    const url = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/browse/facet_options");
    expect(url.searchParams.get("facet_name")).toBe("team");
  });
});
