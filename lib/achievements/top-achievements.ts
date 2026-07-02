const TIER_WEIGHT: Record<string, number> = {
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

function tierWeight(tier: string | null): number {
  return tier ? TIER_WEIGHT[tier] ?? 0 : 0;
}

// Groupe les succès en familles : "collection.10" et "collection.50" partagent
// la famille "collection". Les segments comme "first", "10", "1k", "1year" sont
// des paliers du même succès, on les strip. Les segments distinctifs comme
// "pre1990", "goalkeeper", "complete", "founder" restent.
function achievementFamily(key: string): string {
  const parts = key.split(".");
  const last = parts[parts.length - 1];
  const isLevel =
    /^\d+$/.test(last) ||
    last === "first" ||
    /^\d+k$/.test(last) ||
    /^\d+year$/.test(last) ||
    /^\d{4}-\d{2}$/.test(last);
  if (isLevel && parts.length > 1) {
    return parts.slice(0, -1).join(".");
  }
  return key;
}

export interface AchievementRow {
  key: string;
  tier: string | null;
  unlockedAt: Date;
  metadata?: unknown;
}

export interface TopAchievement {
  key: string;
  tier: string | null;
  unlockedAt: string;
  metadata: Record<string, unknown> | null;
}

export function pickTopAchievements(
  rows: AchievementRow[],
  limit: number
): TopAchievement[] {
  const bestByFamily = new Map<string, AchievementRow>();
  for (const row of rows) {
    const family = achievementFamily(row.key);
    const current = bestByFamily.get(family);
    if (!current) {
      bestByFamily.set(family, row);
      continue;
    }
    const currentWeight = tierWeight(current.tier);
    const rowWeight = tierWeight(row.tier);
    if (
      rowWeight > currentWeight ||
      (rowWeight === currentWeight &&
        row.unlockedAt.getTime() > current.unlockedAt.getTime())
    ) {
      bestByFamily.set(family, row);
    }
  }

  return [...bestByFamily.values()]
    .sort((a, b) => {
      const wa = tierWeight(a.tier);
      const wb = tierWeight(b.tier);
      if (wb !== wa) return wb - wa;
      return b.unlockedAt.getTime() - a.unlockedAt.getTime();
    })
    .slice(0, limit)
    .map((a) => ({
      key: a.key,
      tier: a.tier,
      unlockedAt: a.unlockedAt.toISOString(),
      metadata: (a.metadata as Record<string, unknown> | null | undefined) ?? null,
    }));
}
