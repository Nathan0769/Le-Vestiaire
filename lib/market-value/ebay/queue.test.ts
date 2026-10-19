import { describe, it, expect } from "vitest";
import { buildRefreshQueue } from "./queue";

const HOUR = 3600_000;
const NOW = 1_000 * HOUR;
const j = (jerseyId: string) => ({ jerseyId });

describe("buildRefreshQueue", () => {
  it("place un maillot Supporter périmé avant un maillot jamais scanné", () => {
    const queue = buildRefreshQueue(
      [j("free-never"), j("pro-stale")],
      new Map([["pro-stale", NOW - 25 * HOUR]]),
      new Set(["pro-stale"]),
      NOW,
      10
    );
    expect(queue.map((q) => q.jerseyId)).toEqual(["pro-stale", "free-never"]);
  });

  it("classe un maillot Supporter récent avec les autres, par ancienneté", () => {
    const queue = buildRefreshQueue(
      [j("pro-fresh"), j("free-old")],
      new Map([
        ["pro-fresh", NOW - 10 * HOUR],
        ["free-old", NOW - 100 * HOUR],
      ]),
      new Set(["pro-fresh"]),
      NOW,
      10
    );
    expect(queue.map((q) => q.jerseyId)).toEqual(["free-old", "pro-fresh"]);
  });

  it("ordonne chaque groupe du plus ancien au plus récent", () => {
    const queue = buildRefreshQueue(
      [j("pro-b"), j("pro-a"), j("free-b"), j("free-a")],
      new Map([
        ["pro-b", NOW - 30 * HOUR],
        ["pro-a", NOW - 50 * HOUR],
        ["free-b", NOW - 5 * HOUR],
      ]),
      new Set(["pro-a", "pro-b"]),
      NOW,
      10
    );
    expect(queue.map((q) => q.jerseyId)).toEqual(["pro-a", "pro-b", "free-a", "free-b"]);
  });

  it("tronque la file à limit", () => {
    const queue = buildRefreshQueue(
      [j("a"), j("b"), j("c")],
      new Map(),
      new Set(),
      NOW,
      2
    );
    expect(queue).toHaveLength(2);
  });
});
