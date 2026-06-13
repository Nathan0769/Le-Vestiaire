import { describe, it, expect } from "vitest";
import { parseInStockSizes } from "@/lib/cfs-scraper";

function makeHtml(opts: {
  options?: Array<{ label: string; variantId: string }>;
  quantities?: Record<string, number>;
  sku?: Record<string, string>;
}): string {
  const parts: string[] = [];

  if (opts.options) {
    const entries = opts.options
      .map(
        ({ label, variantId }) =>
          `{"id":"opt_${variantId}","label":"${label}","products":["${variantId}"]}`
      )
      .join(",");
    parts.push(`"options":[${entries}]`);
  }

  if (opts.quantities) {
    const entries = Object.entries(opts.quantities)
      .map(([id, qty]) => `"${id}":${qty}`)
      .join(",");
    parts.push(`"quantities":{${entries}}`);
  }

  if (opts.sku) {
    const entries = Object.entries(opts.sku)
      .map(([id, s]) => `"${id}":"${s}"`)
      .join(",");
    parts.push(`"sku":{${entries}}`);
  }

  return parts.join(",");
}

describe("parseInStockSizes", () => {
  describe("méthode primaire (options labels)", () => {
    it("extrait les tailles depuis le champ options", () => {
      const html = makeHtml({
        options: [
          { label: "S", variantId: "1" },
          { label: "M", variantId: "2" },
          { label: "L", variantId: "3" },
        ],
      });
      expect(parseInStockSizes(html).sort()).toEqual(["L", "M", "S"]);
    });

    it("ignore les tailles non-adultes dans options", () => {
      const html = makeHtml({
        options: [
          { label: "S", variantId: "1" },
          { label: "M", variantId: "2" },
          { label: "6", variantId: "3" },
          { label: "28", variantId: "4" },
        ],
      });
      const sizes = parseInStockSizes(html);
      expect(sizes).toContain("S");
      expect(sizes).toContain("M");
      expect(sizes).not.toContain("6");
      expect(sizes).not.toContain("28");
    });

    it("ne duplique pas les tailles", () => {
      const html = makeHtml({
        options: [
          { label: "M", variantId: "1" },
          { label: "M", variantId: "2" },
        ],
      });
      expect(parseInStockSizes(html)).toEqual(["M"]);
    });

    it("gère toutes les tailles adultes reconnues", () => {
      const html = makeHtml({
        options: [
          { label: "XS", variantId: "1" },
          { label: "S", variantId: "2" },
          { label: "M", variantId: "3" },
          { label: "L", variantId: "4" },
          { label: "XL", variantId: "5" },
          { label: "XXL", variantId: "6" },
          { label: "3XL", variantId: "7" },
          { label: "4XL", variantId: "8" },
        ],
      });
      expect(parseInStockSizes(html).sort()).toEqual(
        ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"].sort()
      );
    });
  });

  describe("fallback (quantities + sku)", () => {
    it("utilise quantities+sku si options absent", () => {
      const html = makeHtml({
        quantities: { "100": 5, "101": 3 },
        sku: { "100": "JY0247-S", "101": "JY0247-M" },
      });
      expect(parseInStockSizes(html).sort()).toEqual(["M", "S"]);
    });

    it("exclut les variantes avec qty = 0", () => {
      const html = makeHtml({
        quantities: { "100": 0, "101": 3 },
        sku: { "100": "JY0247-S", "101": "JY0247-M" },
      });
      const sizes = parseInStockSizes(html);
      expect(sizes).not.toContain("S");
      expect(sizes).toContain("M");
    });

    it("exclut les variantes absentes de quantities", () => {
      const html = makeHtml({
        quantities: { "101": 2 },
        sku: { "100": "JY0247-S", "101": "JY0247-L" },
      });
      const sizes = parseInStockSizes(html);
      expect(sizes).not.toContain("S");
      expect(sizes).toContain("L");
    });

    it("ignore les SKU dont le suffixe n'est pas une taille adulte", () => {
      const html = makeHtml({
        quantities: { "100": 1 },
        sku: { "100": "JY0247-CUSTOM" },
      });
      expect(parseInStockSizes(html)).toEqual([]);
    });
  });

  describe("cas limites", () => {
    it("retourne [] si le HTML ne contient aucune donnée de taille", () => {
      expect(parseInStockSizes("<html><body>nothing here</body></html>")).toEqual([]);
    });

    it("retourne [] si quantities et sku sont absents et options aussi", () => {
      expect(parseInStockSizes('{"price":99}')).toEqual([]);
    });
  });
});
