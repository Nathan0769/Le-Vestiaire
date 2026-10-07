import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import {
  ACHIEVEMENTS,
  effectiveTier,
  isKnownAchievementKey,
} from "@/lib/achievements/definitions";
import { getRarityMap } from "@/lib/achievements/rarity";
import { createProgressCache } from "@/lib/achievements/progress-cache";
import { resolveAchievementText } from "@/lib/achievements/resolve-text";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimit = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const unlocked = (
    await prisma.achievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: "desc" },
    })
  ).filter((a) => isKnownAchievementKey(a.key));
  const unlockedKeys = new Set(unlocked.map((a) => a.key));

  const inProgressEntries = Object.entries(ACHIEVEMENTS).filter(
    ([key, def]) => !unlockedKeys.has(key) && !def.hidden
  );

  const getProgress = createProgressCache(user.id);
  const inProgress = await Promise.all(
    inProgressEntries.map(async ([key, def]) => {
      const currentProgress = await getProgress(def.computeProgress);
      const text = resolveAchievementText(key, null);
      return {
        key,
        category: def.category,
        tier: def.tier ?? null,
        currentProgress,
        threshold: def.threshold,
        percentage: Math.min(100, Math.round((currentProgress / def.threshold) * 100)),
        i18nKey: def.i18nKey,
        title: text.title,
        description: text.description,
        howTo: text.howTo,
        imageUrl: text.badgeUrl,
      };
    })
  );

  const hiddenLocked = Object.entries(ACHIEVEMENTS).filter(
    ([key, def]) => !unlockedKeys.has(key) && def.hidden
  ).length;

  const rarity = await getRarityMap();

  const unlockedResolved = unlocked.map((a) => {
    const text = resolveAchievementText(
      a.key,
      a.metadata as Record<string, unknown> | null,
    );
    return {
      ...a,
      tier: effectiveTier(a.key, a.tier),
      title: text.title,
      description: text.description,
      howTo: text.howTo,
      imageUrl: text.badgeUrl,
    };
  });

  return NextResponse.json({
    unlocked: unlockedResolved,
    inProgress,
    hiddenLocked,
    rarity,
  });
}
