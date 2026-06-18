export type TriStateFilter = "all" | "yes" | "no";

export type CollectionFilters = {
  conditions: string[];
  types: string[];
  leagues: string[];
  flocked: TriStateFilter;
  signed: TriStateFilter;
  withPatches: TriStateFilter;
  gift: TriStateFilter;
};

export const EMPTY_FILTERS: CollectionFilters = {
  conditions: [],
  types: [],
  leagues: [],
  flocked: "all",
  signed: "all",
  withPatches: "all",
  gift: "all",
};

export type FilterableItem = {
  condition: string;
  playerName?: string | null;
  playerNumber?: number | null;
  isSigned: boolean;
  isGift: boolean;
  patches?: { id: string }[] | null;
  jersey: {
    type: string;
    club: { league: { name: string } };
  };
};

function matchesTriState(value: boolean, filter: TriStateFilter): boolean {
  if (filter === "all") return true;
  return filter === "yes" ? value : !value;
}

function isFlocked(item: FilterableItem): boolean {
  const hasName = !!item.playerName && item.playerName.trim().length > 0;
  const hasNumber = item.playerNumber !== null && item.playerNumber !== undefined;
  return hasName || hasNumber;
}

function hasPatches(item: FilterableItem): boolean {
  return (item.patches?.length ?? 0) > 0;
}

export function applyCollectionFilters<T extends FilterableItem>(
  items: T[],
  filters: CollectionFilters,
): T[] {
  return items.filter((item) => {
    if (filters.conditions.length > 0 && !filters.conditions.includes(item.condition)) {
      return false;
    }
    if (filters.types.length > 0 && !filters.types.includes(item.jersey.type)) {
      return false;
    }
    if (
      filters.leagues.length > 0 &&
      !filters.leagues.includes(item.jersey.club.league.name)
    ) {
      return false;
    }
    if (!matchesTriState(isFlocked(item), filters.flocked)) return false;
    if (!matchesTriState(item.isSigned, filters.signed)) return false;
    if (!matchesTriState(hasPatches(item), filters.withPatches)) return false;
    if (!matchesTriState(item.isGift, filters.gift)) return false;
    return true;
  });
}

export function countActiveFilters(filters: CollectionFilters): number {
  let count = 0;
  if (filters.conditions.length > 0) count++;
  if (filters.types.length > 0) count++;
  if (filters.leagues.length > 0) count++;
  if (filters.flocked !== "all") count++;
  if (filters.signed !== "all") count++;
  if (filters.withPatches !== "all") count++;
  if (filters.gift !== "all") count++;
  return count;
}
