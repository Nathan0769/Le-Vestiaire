import { describe, it, expect } from "vitest";
import { selectTopJerseys } from "@/lib/collection-share/select-top-jerseys";

type Item = Parameters<typeof selectTopJerseys>[0][number];

function make(id: string, overrides: Partial<Item> = {}): Item {
  return {
    id,
    pinnedAt: null,
    createdAt: new Date("2026-01-01"),
    userRating: null,
    ...overrides,
  } as Item;
}

describe("selectTopJerseys", () => {
  it("returns at most 6 items", () => {
    const items = Array.from({ length: 10 }, (_, i) => make(`j${i}`));
    expect(selectTopJerseys(items)).toHaveLength(6);
  });

  it("returns all items when fewer than 6", () => {
    const items = [make("a"), make("b")];
    expect(selectTopJerseys(items).map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("prioritises pinned items first, sorted by pinnedAt DESC", () => {
    const older = make("older", { pinnedAt: new Date("2026-01-01") });
    const newer = make("newer", { pinnedAt: new Date("2026-06-01") });
    const notPinned = make("plain");
    const result = selectTopJerseys([notPinned, older, newer]);
    expect(result.map((i) => i.id)).toEqual(["newer", "older", "plain"]);
  });

  it("after pinned, prefers items with higher userRating", () => {
    const pinned = make("pinned", { pinnedAt: new Date("2026-01-01") });
    const rated5 = make("rated5", { userRating: 5 });
    const rated3 = make("rated3", { userRating: 3 });
    const unrated = make("unrated");
    const result = selectTopJerseys([unrated, rated3, pinned, rated5]);
    expect(result.map((i) => i.id)).toEqual(["pinned", "rated5", "rated3", "unrated"]);
  });

  it("falls back on createdAt DESC when no pin and no rating", () => {
    const old = make("old", { createdAt: new Date("2026-01-01") });
    const mid = make("mid", { createdAt: new Date("2026-03-01") });
    const recent = make("recent", { createdAt: new Date("2026-06-01") });
    const result = selectTopJerseys([old, recent, mid]);
    expect(result.map((i) => i.id)).toEqual(["recent", "mid", "old"]);
  });

  it("combines all criteria in priority order", () => {
    const items = [
      make("plain-old", { createdAt: new Date("2026-01-01") }),
      make("rated", { userRating: 4 }),
      make("pinned", { pinnedAt: new Date("2026-01-01") }),
      make("plain-recent", { createdAt: new Date("2026-06-01") }),
      make("rated-high", { userRating: 5 }),
    ];
    const result = selectTopJerseys(items);
    expect(result.map((i) => i.id)).toEqual([
      "pinned",
      "rated-high",
      "rated",
      "plain-recent",
      "plain-old",
    ]);
  });
});
