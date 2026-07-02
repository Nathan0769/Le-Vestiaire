import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { getTranslations } from "next-intl/server";
import { Award } from "lucide-react";
import prisma from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { maybeCheckAllAchievements } from "@/lib/achievements/check";
import { PublicUserTabs } from "@/components/users/public-user-tabs";
import { BackButton } from "@/components/ui/back-button";
import { PublicAchievementsView } from "@/components/achievements/public-achievements-view";

export const dynamic = "force-dynamic";

interface PublicAchievementsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PublicAchievementsPageProps) {
  const t = await getTranslations("PublicAchievements");
  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true, leaderboardAnonymous: true },
  });

  if (!user) return { title: "Le Vestiaire" };

  const tPublic = await getTranslations("PublicCollection");
  const displayName = user.leaderboardAnonymous
    ? tPublic("anonymous")
    : user.username ?? user.name;

  return { title: `${t("title", { name: displayName })} - Le Vestiaire` };
}

export default async function PublicAchievementsPage({
  params,
}: PublicAchievementsPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const { id: userId } = await params;

  if (userId === currentUser.id) {
    redirect("/achievements");
  }

  const t = await getTranslations("PublicAchievements");
  const tPublic = await getTranslations("PublicCollection");

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      leaderboardAnonymous: true,
      lastAchievementsFullCheckAt: true,
    },
  });

  if (!targetUser) notFound();

  const isAnonymous = targetUser.leaderboardAnonymous ?? false;

  try {
    await maybeCheckAllAchievements(
      targetUser.id,
      targetUser.lastAchievementsFullCheckAt ?? null,
    );
  } catch (error) {
    console.error("maybeCheckAllAchievements failed for target user:", error);
  }

  const unlocked = await prisma.achievement.findMany({
    where: { userId: targetUser.id },
    orderBy: { unlockedAt: "desc" },
  });

  const totalCatalog = Object.keys(ACHIEVEMENTS).length;
  const displayName = isAnonymous
    ? tPublic("anonymous")
    : targetUser.username ?? targetUser.name;

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      <div className="flex items-center gap-4">
        <BackButton href={`/users/${userId}/collection`} />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Award className="w-6 h-6 text-primary shrink-0" />
          <h1 className="text-2xl font-semibold truncate">
            {t("title", { name: displayName })}
          </h1>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium shrink-0">
            {unlocked.length} / {totalCatalog}
          </span>
        </div>
      </div>

      <PublicUserTabs userId={userId} />

      <PublicAchievementsView
        unlocked={unlocked.map((u) => ({
          id: u.id,
          key: u.key,
          category: u.category,
          tier: u.tier,
          unlockedAt: u.unlockedAt.toISOString(),
        }))}
      />
    </div>
  );
}
