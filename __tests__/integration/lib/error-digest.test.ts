import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { runErrorDigest } from "@/lib/error-digest";
import { recordErrorEvent } from "@/lib/report-error";
import "@/__tests__/setup.integration";

const send = vi.fn().mockResolvedValue({ data: { id: "mail" } });

vi.mock("@/lib/email", () => ({
  resend: { emails: { send: (...args: unknown[]) => send(...args) } },
  FROM_EMAIL: "test@example.com",
  APP_URL: "http://localhost:3000",
}));

const event = { source: "IOS" as const, context: "ios.purchase", message: "<b>raté</b>", stack: null, appVersion: "1.5" };

describe("runErrorDigest", () => {
  beforeEach(async () => {
    send.mockClear();
    await createTestUser({ role: "superadmin" });
  });

  it("envoie les nouvelles erreurs puis les marque notifiées", async () => {
    await recordErrorEvent(event);

    const result = await runErrorDigest();

    expect(result.sent).toBe(1);
    expect(send).toHaveBeenCalledTimes(1);
    const row = await prismaTest.errorEvent.findFirstOrThrow();
    expect(row.notifiedAt).not.toBeNull();
  });

  it("n'envoie rien quand aucune erreur n'est nouvelle", async () => {
    await recordErrorEvent(event);
    await runErrorDigest();
    send.mockClear();

    await runErrorDigest();

    expect(send).not.toHaveBeenCalled();
  });

  it("échappe le HTML des messages", async () => {
    await recordErrorEvent(event);

    await runErrorDigest();

    expect(send.mock.calls[0][0].html).toContain("&lt;b&gt;raté&lt;/b&gt;");
  });

  it("purge les erreurs plus vues depuis 90 jours", async () => {
    await recordErrorEvent(event);
    const later = new Date(Date.now() + 91 * 24 * 60 * 60 * 1000);

    const result = await runErrorDigest(later);

    expect(result.purged).toBe(1);
    expect(await prismaTest.errorEvent.count()).toBe(0);
  });
});
