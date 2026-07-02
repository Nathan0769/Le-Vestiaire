import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const TOP_N = 3;
const TIER_BY_RANK: Record<number, string> = {
  1: "GOLD",
  2: "SILVER",
  3: "BRONZE",
};

export async function snapshotMonthlyBadges(now: Date = new Date()): Promise<number> {
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = `${prevMonthStart.getFullYear()}-${String(prevMonthStart.getMonth() + 1).padStart(2, "0")}`;

  let created = 0;
  const winners = await getCollectionSizeTopForPeriod(
    prevMonthStart,
    currentMonthStart,
    TOP_N,
  );

  for (const winner of winners) {
    const tier = TIER_BY_RANK[winner.rank];
    if (!tier) continue;
    created += await unlockOrIgnore({
      userId: winner.userId,
      key: `leaderboard.monthly_top3.collection_size.${monthLabel}`,
      tier,
      metadata: {
        month: monthLabel,
        category: "collection_size",
        rank: winner.rank,
        score: winner.score,
      },
    });
  }

  return created;
}

async function getCollectionSizeTopForPeriod(
  start: Date,
  end: Date,
  limit: number,
): Promise<Array<{ userId: string; score: number; rank: number }>> {
  const rows = await prisma.userJersey.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: start, lt: end } },
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take: limit,
  });

  return rows.map((row, index) => ({
    userId: row.userId,
    score: row._count._all,
    rank: index + 1,
  }));
}

async function unlockOrIgnore(params: {
  userId: string;
  key: string;
  tier: string;
  metadata: Prisma.InputJsonValue;
}): Promise<number> {
  try {
    await prisma.achievement.create({
      data: {
        userId: params.userId,
        key: params.key,
        category: "LEADERBOARD",
        tier: params.tier,
        metadata: params.metadata,
      },
    });
    return 1;
  } catch (error) {
    if (isUniqueConstraintError(error)) return 0;
    throw error;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
