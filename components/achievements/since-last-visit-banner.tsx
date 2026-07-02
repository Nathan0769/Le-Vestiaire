import Link from "next/link";
import { Trophy } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getTranslations } from "next-intl/server";

export async function SinceLastVisitBanner() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastAchievementsSeenAt: true },
  });

  const count = await prisma.achievement.count({
    where: {
      userId: user.id,
      unlockedAt: dbUser?.lastAchievementsSeenAt
        ? { gt: dbUser.lastAchievementsSeenAt }
        : undefined,
    },
  });

  if (count === 0) return null;

  const t = await getTranslations("achievements");

  return (
    <Link
      href="/achievements"
      className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
    >
      <Trophy className="h-4 w-4 text-primary" />
      <span>{t("sinceLastVisit", { count })}</span>
    </Link>
  );
}
