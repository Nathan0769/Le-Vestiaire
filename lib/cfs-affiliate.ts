export const CFS_CLEARANCE_URL =
  "https://www.classicfootballshirts.co.uk/clearance/?ref=mgi4mta&utm_source=Affiliates&utm_medium=referral&utm_campaign=Tapfiliate";

const WEEKLY_DEALS_SOURCE = "cfs-weekly-deals";

interface FeaturablePromo {
  club: string | null;
  source: string;
}

/**
 * Reorder promos so the first `visibleCount` (the ones shown before "voir plus")
 * are curated: distinct clubs, and up to `weeklyTarget` weekly-deals picks drawn
 * from the top `weeklyPool` weekly deals. The remaining promos keep their original
 * order behind the featured block. No promo is dropped or duplicated.
 */
export function selectFeaturedCfsPromos<T extends FeaturablePromo>(
  promos: T[],
  {
    visibleCount = 6,
    weeklyTarget = 2,
    weeklyPool = 3,
  }: { visibleCount?: number; weeklyTarget?: number; weeklyPool?: number } = {}
): T[] {
  const featured: T[] = [];
  const usedIdx = new Set<number>();
  const usedClubs = new Set<string>();

  const clubKey = (p: T) => (p.club ?? "").trim().toLowerCase();

  // Add promo `i` to the featured block unless its (non-empty) club is already
  // represented there. Returns whether it was added.
  const tryAdd = (i: number): boolean => {
    if (usedIdx.has(i) || featured.length >= visibleCount) return false;
    const key = clubKey(promos[i]);
    if (key && usedClubs.has(key)) return false;
    featured.push(promos[i]);
    usedIdx.add(i);
    if (key) usedClubs.add(key);
    return true;
  };

  // 1. Seed with weekly deals from the top of the pool, distinct clubs only.
  const weeklyIndices = promos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.source === WEEKLY_DEALS_SOURCE)
    .slice(0, weeklyPool)
    .map(({ i }) => i);
  let weeklyAdded = 0;
  for (const i of weeklyIndices) {
    if (weeklyAdded >= weeklyTarget) break;
    if (tryAdd(i)) weeklyAdded++;
  }

  // 2. Fill remaining slots with distinct clubs, in original order.
  for (let i = 0; i < promos.length && featured.length < visibleCount; i++) {
    tryAdd(i);
  }

  // 3. Not enough distinct clubs to fill the block: relax the club constraint.
  for (let i = 0; i < promos.length && featured.length < visibleCount; i++) {
    if (usedIdx.has(i)) continue;
    featured.push(promos[i]);
    usedIdx.add(i);
  }

  // 4. Everything else keeps its original order behind the featured block.
  const rest = promos.filter((_, i) => !usedIdx.has(i));
  return [...featured, ...rest];
}
