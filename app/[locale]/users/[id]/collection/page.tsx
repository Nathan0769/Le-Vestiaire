import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { PublicCollectionScreen } from "@/components/users/public-collection-screen";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function LegacyCollectionPage({ params }: PageProps) {
  const { locale, id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { username: true, leaderboardAnonymous: true },
  });
  if (!user?.username) notFound();

  if (!user.leaderboardAnonymous) {
    permanentRedirect(`/${locale}/u/${user.username}/collection`);
  }

  return (
    <PublicCollectionScreen
      userId={id}
      basePath={`/${locale}/users/${id}`}
    />
  );
}
