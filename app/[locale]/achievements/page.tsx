import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { checkAllAchievements } from "@/lib/achievements/check";
import { AchievementsPageClient } from "@/components/achievements/achievements-page-client";
import type { AchievementsResponse } from "@/hooks/useAchievements";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  let newlyUnlocked: Array<{ key: string; category: string; tier: string | null }> = [];
  try {
    const created = await checkAllAchievements(user.id);
    newlyUnlocked = created.map((a) => ({
      key: a.key,
      category: a.category,
      tier: a.tier,
    }));
  } catch (error) {
    console.error("checkAllAchievements failed on page load:", error);
  }

  const unlocked = await prisma.achievement.findMany({
    where: { userId: user.id },
    orderBy: { unlockedAt: "desc" },
  });
  const unlockedKeys = new Set(unlocked.map((a) => a.key));

  const inProgressEntries = Object.entries(ACHIEVEMENTS).filter(
    ([key, def]) => !unlockedKeys.has(key) && !def.hidden
  );

  const inProgress = await Promise.all(
    inProgressEntries.map(async ([key, def]) => {
      const currentProgress = await def.computeProgress(user.id);
      return {
        key,
        category: def.category,
        tier: def.tier ?? null,
        currentProgress,
        threshold: def.threshold,
        percentage: Math.min(100, Math.round((currentProgress / def.threshold) * 100)),
        i18nKey: def.i18nKey,
      };
    })
  );

  const hiddenLocked = Object.entries(ACHIEVEMENTS).filter(
    ([key, def]) => !unlockedKeys.has(key) && def.hidden
  ).length;

  // Marquer comme vus (fire and forget)
  prisma.user
    .update({
      where: { id: user.id },
      data: { lastAchievementsSeenAt: new Date() },
    })
    .catch((e) => console.error("Failed to mark achievements seen:", e));

  const data: AchievementsResponse = {
    unlocked: unlocked.map((u) => ({
      id: u.id,
      key: u.key,
      category: u.category,
      tier: u.tier,
      unlockedAt: u.unlockedAt.toISOString(),
      metadata: u.metadata as Record<string, unknown> | null,
      isSecret: ACHIEVEMENTS[u.key]?.hidden === true,
    })),
    inProgress,
    hiddenLocked,
  };

  return <AchievementsPageClient data={data} newlyUnlocked={newlyUnlocked} />;
}
