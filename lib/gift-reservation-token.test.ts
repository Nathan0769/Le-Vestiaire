import { describe, expect, it } from "vitest";
import { hashReservationToken, newReservationToken, normalizeGiftName, tokenMatches } from "./gift-reservation-token";

describe("normalizeGiftName", () => {
  it("trime le prénom", () => {
    expect(normalizeGiftName("  Marie ")).toBe("Marie");
  });

  it("refuse un prénom vide", () => {
    expect(normalizeGiftName("   ")).toBeNull();
  });

  it("refuse plus de 40 caractères", () => {
    expect(normalizeGiftName("A".repeat(41))).toBeNull();
  });

  it("refuse autre chose qu'une chaîne", () => {
    expect(normalizeGiftName(42)).toBeNull();
  });
});

describe("jeton de réservation", () => {
  it("fait 43 caractères base64url (32 octets)", () => {
    expect(newReservationToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("change à chaque appel", () => {
    expect(newReservationToken()).not.toBe(newReservationToken());
  });

  it("correspond à son hash et pas à un autre jeton", () => {
    const token = newReservationToken();
    const hash = hashReservationToken(token);
    expect(tokenMatches(token, hash)).toBe(true);
    expect(tokenMatches(newReservationToken(), hash)).toBe(false);
  });

  it("refuse un jeton absent", () => {
    expect(tokenMatches(null, hashReservationToken("x"))).toBe(false);
  });
});
