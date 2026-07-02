import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { maybeCheckAllAchievements } from "@/lib/achievements/check";

const TOTAL_ACHIEVEMENTS = Object.keys(ACHIEVEMENTS).length;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimit = await checkRateLimit(generousRateLimit, identifier);
  if (!rateLimit.success) {
    return NextResponse.json({ count: 0 }, { status: 429 });
  }

  const [dbUser, alreadyUnlockedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        lastAchievementsSeenAt: true,
        lastAchievementsFullCheckAt: true,
      },
    }),
    prisma.achievement.count({ where: { userId: user.id } }),
  ]);

  if (alreadyUnlockedCount < TOTAL_ACHIEVEMENTS) {
    try {
      await maybeCheckAllAchievements(
        user.id,
        dbUser?.lastAchievementsFullCheckAt ?? null
      );
    } catch (error) {
      console.error("maybeCheckAllAchievements failed on unread-count:", error);
    }
  }

  const count = await prisma.achievement.count({
    where: {
      userId: user.id,
      unlockedAt: dbUser?.lastAchievementsSeenAt
        ? { gt: dbUser.lastAchievementsSeenAt }
        : undefined,
    },
  });

  return NextResponse.json({ count });
}
