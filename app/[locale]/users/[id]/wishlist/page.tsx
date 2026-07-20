import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { PublicWishlistScreen } from "@/components/users/public-wishlist-screen";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function LegacyWishlistPage({ params }: PageProps) {
  const { locale, id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { username: true, leaderboardAnonymous: true },
  });
  if (!user?.username) notFound();

  if (!user.leaderboardAnonymous) {
    permanentRedirect(`/${locale}/u/${user.username}/wishlist`);
  }

  return (
    <PublicWishlistScreen
      userId={id}
      basePath={`/${locale}/users/${id}`}
    />
  );
}
