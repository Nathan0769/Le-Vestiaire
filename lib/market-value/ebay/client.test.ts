import { afterEach, describe, expect, it, vi } from "vitest";
import { browseSearch } from "./client";

// Seul mock du chantier : l'appel réseau eBay ne peut pas être réel en test unitaire.
describe("browseSearch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("demande 200 annonces à prix fixe ou offre, jamais les enchères", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ itemSummaries: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await browseSearch("token", "Arsenal 2024/25 home shirt", "EBAY_GB");
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("limit")).toBe("200");
    expect(url.searchParams.get("filter")).toBe("buyingOptions:{FIXED_PRICE|BEST_OFFER}");
  });
});
