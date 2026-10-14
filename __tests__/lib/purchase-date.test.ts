import { describe, it, expect } from "vitest";
import { purchaseDateErrorCode } from "@/lib/purchase-date";

// 14 octobre 2026, 10h UTC
const NOW = new Date("2026-10-14T10:00:00.000Z");

describe("purchaseDateErrorCode", () => {
  it("accepte une date absente (la date d'achat est facultative)", () => {
    expect(purchaseDateErrorCode(undefined, NOW)).toBeNull();
    expect(purchaseDateErrorCode(null, NOW)).toBeNull();
    expect(purchaseDateErrorCode("", NOW)).toBeNull();
  });

  it("accepte une date passée ou celle du jour", () => {
    expect(purchaseDateErrorCode("2019-06-01", NOW)).toBeNull();
    expect(purchaseDateErrorCode("2026-10-14", NOW)).toBeNull();
    expect(purchaseDateErrorCode("2026-10-14T09:59:00Z", NOW)).toBeNull();
  });

  it("refuse une date dans le futur", () => {
    expect(purchaseDateErrorCode("2026-10-16", NOW)).toBe("PURCHASE_DATE_IN_FUTURE");
    expect(purchaseDateErrorCode("2027-01-01T00:00:00Z", NOW)).toBe("PURCHASE_DATE_IN_FUTURE");
  });

  it("accepte le jour suivant en UTC tant qu'il est déjà commencé quelque part (fuseaux en avance)", () => {
    // 23h30 à Paris le 14 = 21h30 UTC : un client en UTC+14 est déjà le 15.
    const lateEvening = new Date("2026-10-14T21:30:00.000Z");
    expect(purchaseDateErrorCode("2026-10-15", lateEvening)).toBeNull();
  });

  it("refuse une date illisible", () => {
    expect(purchaseDateErrorCode("pas-une-date", NOW)).toBe("PURCHASE_DATE_INVALID");
    expect(purchaseDateErrorCode(42, NOW)).toBe("PURCHASE_DATE_INVALID");
  });
});
