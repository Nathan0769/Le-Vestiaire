import { describe, it, expect } from "vitest";
import { computeCollectionStats } from "@/lib/collection-share/stats";

type Item = Parameters<typeof computeCollectionStats>[0][number];

function make(overrides: Partial<Item> = {}): Item {
  return {
    id: crypto.randomUUID(),
    purchasePrice: null,
    jersey: {
      club: {
        id: "club-1",
        league: { id: "league-1", country: "France" },
      },
    },
    ...overrides,
  } as Item;
}

describe("computeCollectionStats", () => {
  it("returns zeros for an empty collection", () => {
    expect(computeCollectionStats([])).toEqual({
      total: 0,
      clubs: 0,
      leagues: 0,
      countries: 0,
      estimatedValue: 0,
    });
  });

  it("counts distinct clubs, leagues and countries", () => {
    const items = [
      make({ jersey: { club: { id: "c1", league: { id: "l1", country: "FR" } } } }),
      make({ jersey: { club: { id: "c1", league: { id: "l1", country: "FR" } } } }),
      make({ jersey: { club: { id: "c2", league: { id: "l2", country: "ES" } } } }),
    ];
    const stats = computeCollectionStats(items);
    expect(stats.total).toBe(3);
    expect(stats.clubs).toBe(2);
    expect(stats.leagues).toBe(2);
    expect(stats.countries).toBe(2);
  });

  it("sums purchasePrice, treating null as zero", () => {
    const items = [
      make({ purchasePrice: 80 }),
      make({ purchasePrice: null }),
      make({ purchasePrice: 45.5 }),
    ];
    expect(computeCollectionStats(items).estimatedValue).toBe(125.5);
  });

  it("returns estimatedValue 0 when all purchasePrice are null", () => {
    const items = [make(), make(), make()];
    expect(computeCollectionStats(items).estimatedValue).toBe(0);
  });
});
