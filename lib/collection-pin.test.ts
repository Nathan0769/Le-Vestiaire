import { describe, expect, it } from "vitest";
import { MAX_PINS, canPin, comparePinnedFirst } from "./collection-pin";

describe("MAX_PINS", () => {
  it("equals 3", () => {
    expect(MAX_PINS).toBe(3);
  });
});

describe("canPin", () => {
  it("returns true when count is below max", () => {
    expect(canPin(0)).toBe(true);
    expect(canPin(2)).toBe(true);
  });

  it("returns false when count equals max", () => {
    expect(canPin(MAX_PINS)).toBe(false);
  });

  it("returns false when count exceeds max", () => {
    expect(canPin(MAX_PINS + 1)).toBe(false);
  });
});

describe("comparePinnedFirst", () => {
  it("returns 0 when neither is pinned", () => {
    expect(comparePinnedFirst(null, null)).toBe(0);
  });

  it("returns negative when only a is pinned", () => {
    expect(comparePinnedFirst(new Date(), null)).toBeLessThan(0);
  });

  it("returns positive when only b is pinned", () => {
    expect(comparePinnedFirst(null, new Date())).toBeGreaterThan(0);
  });

  it("returns negative when a is pinned more recently than b", () => {
    const older = new Date("2024-01-01");
    const newer = new Date("2024-06-01");
    expect(comparePinnedFirst(newer, older)).toBeLessThan(0);
  });

  it("returns positive when b is pinned more recently than a", () => {
    const older = new Date("2024-01-01");
    const newer = new Date("2024-06-01");
    expect(comparePinnedFirst(older, newer)).toBeGreaterThan(0);
  });

  it("accepts ISO strings", () => {
    const older = "2024-01-01T00:00:00.000Z";
    const newer = "2024-06-01T00:00:00.000Z";
    expect(comparePinnedFirst(newer, older)).toBeLessThan(0);
  });

  it("returns 0 when both are pinned at exactly the same time", () => {
    const t = new Date("2024-01-01");
    expect(comparePinnedFirst(t, t)).toBe(0);
  });
});
