import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PublicAchievementsScreen } from "@/components/users/public-achievements-screen";

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
    robots: user.usernameGenerated || user.leaderboardAnonymous
      ? { index: false, follow: true }
      : undefined,
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
  const { locale, username: raw } = await params;
  const username = raw.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, leaderboardAnonymous: true },
  });

  if (!user) notFound();

  if (user.leaderboardAnonymous) {
    redirect(`/${locale}/users/${user.id}/achievements`);
  }

  return (
    <PublicAchievementsScreen
      userId={user.id}
      basePath={`/${locale}/u/${username}`}
    />
  );
}
