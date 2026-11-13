import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/affiliate/tapfiliate/route";
import { prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";

vi.mock("@/lib/rate-limit", () => ({
  generousRateLimit: {},
  getRateLimitIdentifier: vi.fn().mockResolvedValue("test-identifier"),
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: 0 }),
}));

const SECRET = "secret-de-test-postback";

function get(params: Record<string, string>) {
  return GET(new Request(`http://localhost/api/affiliate/tapfiliate?${new URLSearchParams(params)}`));
}

describe("GET /api/affiliate/tapfiliate", () => {
  beforeEach(() => vi.stubEnv("TAPFILIATE_POSTBACK_SECRET", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  it("enregistre une conversion avec son emplacement", async () => {
    const res = await get({
      token: SECRET,
      conversion_id: "conv_1",
      conversion_amount: "121.94",
      commission_amount: "12.19",
      conversion_status: "pending",
      click_subid: "fiche-cmjersey1",
    });

    expect(res.status).toBe(200);
    const row = await prismaTest.affiliateConversion.findFirstOrThrow();
    expect(row).toMatchObject({ conversionId: "conv_1", placement: "fiche", targetId: "cmjersey1", status: "pending" });
    expect(Number(row.commission)).toBe(12.19);
  });

  it("met à jour le statut sans effacer les champs déjà reçus", async () => {
    await get({ token: SECRET, conversion_id: "conv_1", commission_amount: "12.19", conversion_status: "pending" });
    await get({ token: SECRET, conversion_id: "conv_1", conversion_status: "approved" });

    const rows = await prismaTest.affiliateConversion.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("approved");
    expect(Number(rows[0].commission)).toBe(12.19);
  });

  it("refuse un mauvais jeton", async () => {
    const res = await get({ token: "faux", conversion_id: "conv_1" });

    expect(res.status).toBe(401);
    expect(await prismaTest.affiliateConversion.count()).toBe(0);
  });

  it("répond 503 tant que le secret n'est pas configuré", async () => {
    vi.stubEnv("TAPFILIATE_POSTBACK_SECRET", "");
    expect((await get({ token: "", conversion_id: "conv_1" })).status).toBe(503);
  });
});
