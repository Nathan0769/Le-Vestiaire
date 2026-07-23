import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";

/** Nombre de possesseurs pour une clé de succès donnée. */
export interface AchievementOwnerCount {
  key: string;
  users: number;
}

/** Map clé de succès -> ratio de collectionneurs l'ayant débloqué (0..1). */
export type RarityMap = Record<string, number>;

const RARITY_CACHE_KEY = "achievements:rarity:v1";
const RARITY_CACHE_TTL_SECONDS = 6 * 60 * 60; // 6h

/**
 * Transforme des comptes de possesseurs en ratios de rareté.
 * Fonction pure, testable sans I/O.
 */
export function computeRarityMap(
  counts: AchievementOwnerCount[],
  totalUsers: number,
): RarityMap {
  if (totalUsers <= 0) return {};

  const map: RarityMap = {};
  for (const { key, users } of counts) {
    // Le count users peut être mis en cache et devenir transitoirement
    // inférieur au nombre de possesseurs : on plafonne à 1.
    map[key] = Math.min(1, users / totalUsers);
  }
  return map;
}

/**
 * Récupère la map de rareté, mise en cache globalement dans Redis (6h).
 * La donnée est identique pour tous les utilisateurs : un seul calcul agrégé.
 */
export async function getRarityMap(): Promise<RarityMap> {
  try {
    const cached = await redis.get<RarityMap>(RARITY_CACHE_KEY);
    if (cached) return cached;
  } catch (error) {
    console.error("Rarity cache read failed:", error);
  }

  const [grouped, totalUsers] = await Promise.all([
    prisma.achievement.groupBy({
      by: ["key"],
      _count: { userId: true },
    }),
    prisma.user.count(),
  ]);

  const counts: AchievementOwnerCount[] = grouped.map((g) => ({
    key: g.key,
    users: g._count.userId,
  }));

  const map = computeRarityMap(counts, totalUsers);

  try {
    await redis.set(RARITY_CACHE_KEY, map, { ex: RARITY_CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("Rarity cache write failed:", error);
  }

  return map;
}
