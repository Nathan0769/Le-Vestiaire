import { describe, it, expect, beforeEach } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestSetup } from "@/__tests__/helpers/fixtures";
import { recomputeAllMarketValues } from "@/lib/market-value/compute";
import "@/__tests__/setup.integration";

describe("recomputeAllMarketValues", () => {
  let jerseyId: string;

  beforeEach(async () => {
    const { jersey } = await createTestSetup();
    jerseyId = jersey.id;
    await prismaTest.ebayMarketData.create({
      data: { jerseyId, medianPrice: 80, sampleSize: 25, currency: "EUR", marketId: "EBAY_FR", query: "q" },
    });
  });

  it("n'écrit pas de snapshot quand la cote n'a pas changé", async () => {
    await recomputeAllMarketValues();
    await recomputeAllMarketValues();

    expect(await prismaTest.jerseyMarketValueSnapshot.count({ where: { jerseyId } })).toBe(1);
  });

  it("écrit un snapshot quand la cote change", async () => {
    await recomputeAllMarketValues();
    await prismaTest.ebayMarketData.update({ where: { jerseyId }, data: { medianPrice: 120 } });
    await recomputeAllMarketValues();

    expect(await prismaTest.jerseyMarketValueSnapshot.count({ where: { jerseyId } })).toBe(2);
  });

  it("compte tous les produits CFS de référence, ruptures comprises, mais pas les autres versions", async () => {
    const product = (cfsId: string, price: number, over: { inStock?: boolean; isReference?: boolean } = {}) => ({
      cfsId,
      jerseyId,
      name: `Produit ${cfsId}`,
      price,
      inStock: over.inStock ?? true,
      isReference: over.isReference ?? true,
      condition: "GOOD" as const,
      productUrl: `https://www.classicfootballshirts.com/${cfsId}.html`,
      imageUrl: `https://www.classicfootballshirts.co.uk/${cfsId}.jpg`,
    });
    await prismaTest.cfsProduct.createMany({
      data: [
        product("a", 100),
        product("b", 120, { inStock: false }),
        product("c", 140),
        product("pro", 400, { isReference: false }),
      ],
    });

    await recomputeAllMarketValues();

    const value = await prismaTest.jerseyMarketValue.findUnique({ where: { jerseyId } });
    // CFS : médiane 120 × 0,73 = 87,6 ; eBay : 80 × 0,85 = 68 ; poids égaux -> 77,8.
    expect(value?.baseValue).toBeCloseTo(77.8, 1);
  });
});
