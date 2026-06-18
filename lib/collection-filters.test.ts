import { describe, it, expect } from "vitest";
import {
  applyCollectionFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  type CollectionFilters,
  type FilterableItem,
} from "./collection-filters";

function makeItem(overrides: Partial<FilterableItem> = {}): FilterableItem {
  return {
    condition: "GOOD",
    playerName: null,
    playerNumber: null,
    isSigned: false,
    isGift: false,
    patches: [],
    jersey: {
      type: "HOME",
      club: { league: { name: "Ligue 1" } },
    },
    ...overrides,
  };
}

function filters(overrides: Partial<CollectionFilters> = {}): CollectionFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe("applyCollectionFilters", () => {
  it("returns all items when filters are empty", () => {
    const items = [makeItem(), makeItem({ condition: "MINT" })];
    expect(applyCollectionFilters(items, EMPTY_FILTERS)).toHaveLength(2);
  });

  it("filters by single condition", () => {
    const items = [
      makeItem({ condition: "MINT" }),
      makeItem({ condition: "GOOD" }),
      makeItem({ condition: "POOR" }),
    ];
    const result = applyCollectionFilters(items, filters({ conditions: ["MINT"] }));
    expect(result).toHaveLength(1);
    expect(result[0].condition).toBe("MINT");
  });

  it("filters by multiple conditions (OR within category)", () => {
    const items = [
      makeItem({ condition: "MINT" }),
      makeItem({ condition: "EXCELLENT" }),
      makeItem({ condition: "POOR" }),
    ];
    const result = applyCollectionFilters(
      items,
      filters({ conditions: ["MINT", "EXCELLENT"] }),
    );
    expect(result).toHaveLength(2);
  });

  it("filters by jersey type", () => {
    const items = [
      makeItem({ jersey: { type: "HOME", club: { league: { name: "L1" } } } }),
      makeItem({ jersey: { type: "AWAY", club: { league: { name: "L1" } } } }),
    ];
    const result = applyCollectionFilters(items, filters({ types: ["HOME"] }));
    expect(result).toHaveLength(1);
    expect(result[0].jersey.type).toBe("HOME");
  });

  it("filters by league name", () => {
    const items = [
      makeItem({ jersey: { type: "HOME", club: { league: { name: "Ligue 1" } } } }),
      makeItem({ jersey: { type: "HOME", club: { league: { name: "Premier League" } } } }),
    ];
    const result = applyCollectionFilters(items, filters({ leagues: ["Ligue 1"] }));
    expect(result).toHaveLength(1);
    expect(result[0].jersey.club.league.name).toBe("Ligue 1");
  });

  it("applies AND between categories", () => {
    const items = [
      makeItem({ condition: "MINT", jersey: { type: "HOME", club: { league: { name: "L1" } } } }),
      makeItem({ condition: "MINT", jersey: { type: "AWAY", club: { league: { name: "L1" } } } }),
      makeItem({ condition: "GOOD", jersey: { type: "HOME", club: { league: { name: "L1" } } } }),
    ];
    const result = applyCollectionFilters(
      items,
      filters({ conditions: ["MINT"], types: ["HOME"] }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].condition).toBe("MINT");
    expect(result[0].jersey.type).toBe("HOME");
  });

  it("filters flocked=yes when playerName is set", () => {
    const items = [
      makeItem({ playerName: "Mbappé" }),
      makeItem({ playerName: null, playerNumber: null }),
    ];
    const result = applyCollectionFilters(items, filters({ flocked: "yes" }));
    expect(result).toHaveLength(1);
    expect(result[0].playerName).toBe("Mbappé");
  });

  it("filters flocked=yes when only playerNumber is set", () => {
    const items = [
      makeItem({ playerName: null, playerNumber: 10 }),
      makeItem({ playerName: null, playerNumber: null }),
    ];
    const result = applyCollectionFilters(items, filters({ flocked: "yes" }));
    expect(result).toHaveLength(1);
    expect(result[0].playerNumber).toBe(10);
  });

  it("filters flocked=no excludes any flocked item", () => {
    const items = [
      makeItem({ playerName: "Mbappé" }),
      makeItem({ playerNumber: 7 }),
      makeItem({ playerName: null, playerNumber: null }),
    ];
    const result = applyCollectionFilters(items, filters({ flocked: "no" }));
    expect(result).toHaveLength(1);
  });

  it("treats empty playerName string as not flocked", () => {
    const items = [
      makeItem({ playerName: "  ", playerNumber: null }),
      makeItem({ playerName: "Mbappé" }),
    ];
    const result = applyCollectionFilters(items, filters({ flocked: "no" }));
    expect(result).toHaveLength(1);
    expect(result[0].playerName?.trim()).toBe("");
  });

  it("filters signed=yes / signed=no", () => {
    const items = [makeItem({ isSigned: true }), makeItem({ isSigned: false })];
    expect(applyCollectionFilters(items, filters({ signed: "yes" }))).toHaveLength(1);
    expect(applyCollectionFilters(items, filters({ signed: "no" }))).toHaveLength(1);
  });

  it("filters withPatches=yes when patches array has items", () => {
    const items = [
      makeItem({ patches: [{ id: "p1" }] }),
      makeItem({ patches: [] }),
      makeItem({ patches: null }),
    ];
    const result = applyCollectionFilters(items, filters({ withPatches: "yes" }));
    expect(result).toHaveLength(1);
  });

  it("filters withPatches=no when patches missing or empty", () => {
    const items = [
      makeItem({ patches: [{ id: "p1" }] }),
      makeItem({ patches: [] }),
      makeItem({ patches: null }),
    ];
    const result = applyCollectionFilters(items, filters({ withPatches: "no" }));
    expect(result).toHaveLength(2);
  });

  it("filters gift=yes / gift=no", () => {
    const items = [makeItem({ isGift: true }), makeItem({ isGift: false })];
    expect(applyCollectionFilters(items, filters({ gift: "yes" }))).toHaveLength(1);
    expect(applyCollectionFilters(items, filters({ gift: "no" }))).toHaveLength(1);
  });
});

describe("countActiveFilters", () => {
  it("returns 0 for empty filters", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it("counts non-empty arrays and tri-states that are not 'all'", () => {
    const f = filters({
      conditions: ["MINT"],
      flocked: "yes",
    });
    expect(countActiveFilters(f)).toBe(2);
  });

  it("counts each non-default tri-state independently", () => {
    const f = filters({
      conditions: ["MINT", "EXCELLENT"],
      types: ["HOME"],
      leagues: ["Ligue 1"],
      flocked: "yes",
      signed: "no",
      withPatches: "yes",
      gift: "no",
    });
    expect(countActiveFilters(f)).toBe(7);
  });
});
