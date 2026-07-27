import { describe, it, expect } from "vitest";
import { isSupporter } from "@/lib/subscription";

describe("isSupporter", () => {
  it("returns true for an active supporter", () => {
    expect(isSupporter({ plan: "PRO" })).toBe(true);
  });

  it("returns false for a free user", () => {
    expect(isSupporter({ plan: "FREE" })).toBe(false);
  });

  it("returns false when the user is null or undefined", () => {
    expect(isSupporter(null)).toBe(false);
    expect(isSupporter(undefined)).toBe(false);
  });
});
