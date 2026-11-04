import { describe, it, expect } from "vitest";
import { ASKING_ABATEMENT, signalAbatement } from "@/lib/market-value/config";

describe("signalAbatement", () => {
  it("abat une vente CFS comme un prix demandé CFS (ventes au niveau de prix de CFS, pas d'eBay)", () => {
    expect(signalAbatement("cfs", "sold")).toBe(ASKING_ABATEMENT.cfs);
  });
});
