import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { getRarityMap } from "@/lib/achievements/rarity";

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

  const rarity = await getRarityMap();

  return NextResponse.json({ unlocked, inProgress, hiddenLocked, rarity });
}
