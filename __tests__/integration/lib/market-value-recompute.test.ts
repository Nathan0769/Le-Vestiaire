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
});
