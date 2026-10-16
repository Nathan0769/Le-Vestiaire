import { describe, it, expect } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { recordErrorEvent, reportError } from "@/lib/report-error";
import "@/__tests__/setup.integration";

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
