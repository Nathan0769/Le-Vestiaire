import { describe, it, expect } from "vitest";
import {
  redactSensitive,
  errorFingerprint,
  toErrorParts,
  buildErrorEvent,
  isPaymentErrorContext,
  MESSAGE_MAX,
  STACK_MAX,
} from "@/lib/error-events";

describe("redactSensitive", () => {
  it("masque les adresses email", () => {
    expect(redactSensitive("échec pour jean.dupont@gmail.com")).toBe("échec pour [email]");
  });

  it("masque les tokens Bearer", () => {
    expect(redactSensitive("Authorization: Bearer abc.def-123")).toBe("Authorization: Bearer [token]");
  });

  it("masque les tokens longs", () => {
    expect(redactSensitive("key abcdefghijklmnopqrstuvwxyz0123456789 invalide")).toBe(
      "key [token] invalide"
    );
  });
});

describe("errorFingerprint", () => {
  const base = { source: "SERVER" as const, context: "stripe.webhook", appVersion: null };

  it("regroupe les messages qui ne diffèrent que par un id ou un nombre", () => {
    const a = errorFingerprint({ ...base, message: "User clx1a2b3c4d5e6f7g8h9i0j1k not found (42)" });
    const b = errorFingerprint({ ...base, message: "User clz9y8x7w6v5u4t3s2r1q0p9o not found (7)" });
    expect(a).toBe(b);
  });

  it("sépare deux contextes différents", () => {
    const a = errorFingerprint({ ...base, message: "boom" });
    const b = errorFingerprint({ ...base, context: "push.send", message: "boom" });
    expect(a).not.toBe(b);
  });

  it("sépare deux versions d'app différentes", () => {
    const a = errorFingerprint({ ...base, source: "IOS", appVersion: "1.5", message: "boom" });
    const b = errorFingerprint({ ...base, source: "IOS", appVersion: "1.6", message: "boom" });
    expect(a).not.toBe(b);
  });
});

describe("toErrorParts", () => {
  it("lit message et stack d'une Error", () => {
    const err = new Error("boom");
    const parts = toErrorParts(err);
    expect(parts.message).toBe("Error: boom");
    expect(parts.stack).toContain("error-events.test");
  });

  it("accepte une chaîne", () => {
    expect(toErrorParts("raté")).toEqual({ message: "raté", stack: null });
  });

  it("sérialise un objet inconnu", () => {
    expect(toErrorParts({ code: 12 }).message).toBe('{"code":12}');
  });
});

describe("buildErrorEvent", () => {
  it("tronque message et stack", () => {
    const event = buildErrorEvent({
      source: "IOS",
      context: "ios.crash",
      message: "ab ".repeat(MESSAGE_MAX),
      stack: "at f\n".repeat(STACK_MAX),
      appVersion: "1.5",
    });
    expect(event.message.length).toBe(MESSAGE_MAX);
    expect(event.stack?.length).toBe(STACK_MAX);
  });

  it("rédige le message et la stack", () => {
    const event = buildErrorEvent({
      source: "SERVER",
      context: "auth",
      message: "mail a@b.fr",
      stack: "at a@b.fr",
      appVersion: null,
    });
    expect(event.message).toBe("mail [email]");
    expect(event.stack).toBe("at [email]");
  });
});

describe("isPaymentErrorContext", () => {
  it("reconnaît les erreurs serveur liées au paiement", () => {
    expect(["revenuecat.webhook", "supporter.sync", "stripe.webhook.invoice.paid"].every(isPaymentErrorContext)).toBe(true);
  });

  it("ignore les autres erreurs, même proches", () => {
    expect(["market-value.new-supporter-scan", "jerseys.create", "stripe"].some(isPaymentErrorContext)).toBe(false);
  });
});
