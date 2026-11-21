import { describe, it, expect } from "vitest";
import { ASKING_ABATEMENT, MARKET_METHOD_VERSION, signalAbatement } from "@/lib/market-value/config";

describe("signalAbatement", () => {
  it("abat une vente CFS comme un prix demandé CFS (ventes au niveau de prix de CFS, pas d'eBay)", () => {
    expect(signalAbatement("cfs", "sold")).toBe(ASKING_ABATEMENT[MARKET_METHOD_VERSION].cfs);
  });
  it("suit la version de méthode demandée", () => {
    expect(signalAbatement("ebay", "asking", 1)).toBe(0.85);
    expect(signalAbatement("ebay", "asking", 2)).toBe(ASKING_ABATEMENT[2].ebay);
  });
});
