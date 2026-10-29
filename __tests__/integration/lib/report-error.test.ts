import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { recordErrorEvent, reportError } from "@/lib/report-error";
import "@/__tests__/setup.integration";

const send = vi.fn();

vi.mock("@/lib/email", () => ({
  resend: { emails: { send: (...args: unknown[]) => send(...args) } },
  FROM_EMAIL: "test@example.com",
  APP_URL: "http://localhost:3000",
}));

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: "mail" }, error: null });
});

const input = {
  source: "SERVER" as const,
  context: "test.context",
  message: "boom 42",
  stack: null,
  appVersion: null,
};

describe("recordErrorEvent", () => {
  it("compte les occurrences d'une même erreur sur une seule ligne", async () => {
    await recordErrorEvent(input);
    await recordErrorEvent({ ...input, message: "boom 43" });

    const rows = await prismaTest.errorEvent.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
  });

  it("rouvre et re-notifie une erreur résolue qui revient", async () => {
    await recordErrorEvent(input);
    await prismaTest.errorEvent.updateMany({ data: { resolvedAt: new Date(), notifiedAt: new Date() } });

    await recordErrorEvent(input);

    const row = await prismaTest.errorEvent.findFirstOrThrow();
    expect(row.resolvedAt).toBeNull();
    expect(row.notifiedAt).toBeNull();
  });

  it("ne re-notifie pas une erreur ouverte déjà signalée", async () => {
    await recordErrorEvent(input);
    const notifiedAt = new Date();
    await prismaTest.errorEvent.updateMany({ data: { notifiedAt } });

    await recordErrorEvent(input);

    const row = await prismaTest.errorEvent.findFirstOrThrow();
    expect(row.notifiedAt).toEqual(notifiedAt);
  });
});

describe("reportError", () => {
  it("enregistre une erreur serveur", async () => {
    await reportError("stripe.webhook", new Error("signature invalide"));

    const row = await prismaTest.errorEvent.findFirstOrThrow();
    expect(row.source).toBe("SERVER");
    expect(row.message).toBe("Error: signature invalide");
  });
});

describe("reportError sur le parcours d'achat", () => {
  beforeEach(async () => {
    await createTestUser({ role: "superadmin" });
  });

  it("alerte tout de suite et marque l'erreur notifiée", async () => {
    await reportError("revenuecat.webhook", new Error("RevenueCat a répondu 401"));

    expect(send).toHaveBeenCalledTimes(1);
    const row = await prismaTest.errorEvent.findFirstOrThrow();
    expect(row.notifiedAt).not.toBeNull();
  });

  it("n'alerte qu'une fois pour la même erreur répétée", async () => {
    await reportError("revenuecat.webhook", new Error("RevenueCat a répondu 401"));
    await reportError("revenuecat.webhook", new Error("RevenueCat a répondu 401"));

    expect(send).toHaveBeenCalledTimes(1);
  });

  it("laisse l'erreur au digest si l'email échoue", async () => {
    send.mockResolvedValue({ data: null, error: { message: "quota" } });

    await reportError("supporter.sync", new Error("RevenueCat a répondu 401"));

    const row = await prismaTest.errorEvent.findFirstOrThrow();
    expect(row.notifiedAt).toBeNull();
  });

  it("garde les autres erreurs pour le digest", async () => {
    await reportError("jerseys.create", new Error("boom"));

    expect(send).not.toHaveBeenCalled();
  });
});
