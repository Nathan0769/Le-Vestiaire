import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { getTranslations } from "next-intl/server";
import { Award } from "lucide-react";
import prisma from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { maybeCheckAllAchievements } from "@/lib/achievements/check";
import { PublicUserTabs } from "@/components/users/public-user-tabs";
import { AuthGateBanner } from "@/components/auth/auth-gate-banner";
import { BackButton } from "@/components/ui/back-button";
import { PublicAchievementsView } from "@/components/achievements/public-achievements-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: raw } = await params;
  const username = raw.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      usernameGenerated: true,
      leaderboardAnonymous: true,
    },
  });

  if (!user) return { title: "Le Vestiaire" };

  const displayName = user.leaderboardAnonymous
    ? "Utilisateur"
    : user.name ?? user.username;
  const title = `Achievements de @${user.username} sur Le Vestiaire`;
  const description = `Découvrez les achievements de ${displayName} sur Le Vestiaire.`;
  const url = `https://levestiaire.app/u/${user.username}/achievements`;

  return {
    title,
    description,
    robots: user.usernameGenerated ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      type: "profile",
      url,
      siteName: "Le Vestiaire",
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: url },
  };
}

export default async function PublicAchievementsPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();
  const { username: raw } = await params;
  const username = raw.toLowerCase();

  const t = await getTranslations("PublicAchievements");
  const tPublic = await getTranslations("PublicCollection");

  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      leaderboardAnonymous: true,
      lastAchievementsFullCheckAt: true,
    },
  });

  if (!targetUser) notFound();

  const userId = targetUser.id;

  if (currentUser && userId === currentUser.id) {
    redirect("/achievements");
  }

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
      {!currentUser && <AuthGateBanner />}

      <div className="flex items-center gap-4">
        <BackButton href={`/u/${targetUser.username}/collection`} />
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

      <PublicUserTabs username={targetUser.username} />

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
