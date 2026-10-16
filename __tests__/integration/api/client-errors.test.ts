import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/client-errors/route";
import { prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";

vi.mock("@/lib/rate-limit", () => ({
  clientErrorsRateLimit: {},
  getRateLimitIdentifier: vi.fn().mockResolvedValue("test-identifier"),
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 30, remaining: 29, reset: 0 }),
}));

function post(body: unknown, version = "1.5") {
  return POST(
    new Request("http://localhost/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Version": version },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

describe("POST /api/client-errors", () => {
  it("enregistre une erreur iOS avec la version de l'app", async () => {
    const res = await post({ context: "ios.purchase", message: "StoreKit indisponible" });

    expect(res.status).toBe(204);
    const row = await prismaTest.errorEvent.findFirstOrThrow();
    expect(row.source).toBe("IOS");
    expect(row.appVersion).toBe("1.5");
  });

  it("refuse un contexte hors du préfixe ios.", async () => {
    const res = await post({ context: "stripe.webhook", message: "faux" });

    expect(res.status).toBe(400);
    expect(await prismaTest.errorEvent.count()).toBe(0);
  });

  it("refuse un corps trop volumineux", async () => {
    const res = await post({ context: "ios.crash", message: "x", stack: "y".repeat(20_000) });

    expect(res.status).toBe(413);
  });

  it("refuse un JSON invalide", async () => {
    const res = await post("pas du json");

    expect(res.status).toBe(400);
  });
});
