import { describe, expect, it } from "vitest";
import {
  MAX_USER_JERSEY_PHOTOS,
  normalizeUserPhotoPaths,
  getRemovedPhotoPaths,
} from "./user-jersey-photos";

describe("MAX_USER_JERSEY_PHOTOS", () => {
  it("equals 2", () => {
    expect(MAX_USER_JERSEY_PHOTOS).toBe(2);
  });
});

describe("normalizeUserPhotoPaths", () => {
  it("accepts an empty array", () => {
    const result = normalizeUserPhotoPaths([]);
    expect(result).toEqual({ ok: true, paths: [] });
  });

  it("accepts a valid array of paths", () => {
    const result = normalizeUserPhotoPaths(["user/a.jpg", "user/b.jpg"]);
    expect(result).toEqual({ ok: true, paths: ["user/a.jpg", "user/b.jpg"] });
  });

  it("wraps a single non-empty string (legacy compat)", () => {
    const result = normalizeUserPhotoPaths("user/a.jpg");
    expect(result).toEqual({ ok: true, paths: ["user/a.jpg"] });
  });

  it("treats null and undefined as empty", () => {
    expect(normalizeUserPhotoPaths(null)).toEqual({ ok: true, paths: [] });
    expect(normalizeUserPhotoPaths(undefined)).toEqual({ ok: true, paths: [] });
  });

  it("filters out empty and whitespace-only strings", () => {
    const result = normalizeUserPhotoPaths(["user/a.jpg", "", "   "]);
    expect(result).toEqual({ ok: true, paths: ["user/a.jpg"] });
  });

  it("deduplicates while preserving order", () => {
    const result = normalizeUserPhotoPaths([
      "user/a.jpg",
      "user/b.jpg",
      "user/a.jpg",
    ]);
    expect(result).toEqual({ ok: true, paths: ["user/a.jpg", "user/b.jpg"] });
  });

  it("rejects a non-array, non-string value", () => {
    const result = normalizeUserPhotoPaths({ foo: "bar" });
    expect(result.ok).toBe(false);
  });

  it("rejects an array containing a non-string element", () => {
    const result = normalizeUserPhotoPaths(["user/a.jpg", 42]);
    expect(result.ok).toBe(false);
  });

  it("rejects more than MAX_USER_JERSEY_PHOTOS distinct paths", () => {
    const result = normalizeUserPhotoPaths([
      "user/a.jpg",
      "user/b.jpg",
      "user/c.jpg",
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("getRemovedPhotoPaths", () => {
  it("returns paths present in existing but not in next", () => {
    expect(
      getRemovedPhotoPaths(["a", "b"], ["a"])
    ).toEqual(["b"]);
  });

  it("returns all existing when next is empty", () => {
    expect(getRemovedPhotoPaths(["a", "b"], [])).toEqual(["a", "b"]);
  });

  it("returns empty when nothing removed", () => {
    expect(getRemovedPhotoPaths(["a"], ["a", "b"])).toEqual([]);
  });

  it("handles empty existing", () => {
    expect(getRemovedPhotoPaths([], ["a"])).toEqual([]);
  });
});
