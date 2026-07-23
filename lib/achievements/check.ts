import type { Achievement } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ACHIEVEMENTS, type AchievementTrigger, type AchievementDefinition } from "./definitions";
import { createProgressCache } from "./progress-cache";

export async function checkAchievements(
  userId: string,
  trigger: AchievementTrigger
): Promise<Achievement[]> {
  const entries = Object.entries(ACHIEVEMENTS).filter(([, def]) =>
    def.triggers.includes(trigger)
  );

  if (entries.length === 0) return [];
  return checkEntries(userId, entries);
}

export async function checkAllAchievements(userId: string): Promise<Achievement[]> {
  const entries = Object.entries(ACHIEVEMENTS);
  const unlocks = await checkEntries(userId, entries);
  await prisma.user.update({
    where: { id: userId },
    data: { lastAchievementsFullCheckAt: new Date() },
  });
  return unlocks;
}

const FULL_CHECK_THROTTLE_MS = 6 * 60 * 60 * 1000;

export async function maybeCheckAllAchievements(
  userId: string,
  lastFullCheckAt: Date | null
): Promise<Achievement[]> {
  if (
    lastFullCheckAt &&
    Date.now() - lastFullCheckAt.getTime() < FULL_CHECK_THROTTLE_MS
  ) {
    return [];
  }
  return checkAllAchievements(userId);
}

async function checkEntries(
  userId: string,
  entries: Array<[string, AchievementDefinition]>
): Promise<Achievement[]> {

  const alreadyUnlocked = await prisma.achievement.findMany({
    where: {
      userId,
      key: { in: entries.map(([key]) => key) },
    },
    select: { key: true },
  });
  const unlockedKeys = new Set(alreadyUnlocked.map((a) => a.key));

  const toCheck = entries.filter(([key]) => !unlockedKeys.has(key));

  // Mutualise les métriques partagées entre paliers et les lance en parallèle.
  const getProgress = createProgressCache(userId);
  await Promise.all(toCheck.map(([, def]) => getProgress(def.computeProgress)));

  const newUnlocks: Achievement[] = [];

  for (const [key, def] of toCheck) {
    const progress = await getProgress(def.computeProgress);
    if (progress < def.threshold) continue;

    try {
      const created = await prisma.achievement.create({
        data: {
          userId,
          key,
          category: def.category,
          tier: def.tier ?? null,
          metadata: { progress },
        },
      });
      newUnlocks.push(created);
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  return newUnlocks;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
