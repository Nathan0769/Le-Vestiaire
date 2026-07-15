import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { FriendWishlistStats } from "@/components/friends/friend-wishlist-stats";
import { FriendWishlistGrid } from "@/components/friends/friend-wishlist-grid";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { SocialLinksRow } from "@/components/profiles/social-links-row";
import { PublicUserTabs } from "@/components/users/public-user-tabs";
import { FriendshipButton } from "@/components/users/friendship-button";
import { AuthGateBanner } from "@/components/auth/auth-gate-banner";
import { BackButton } from "@/components/ui/back-button";
import { Gift, Heart, EyeOff } from "lucide-react";
import prisma from "@/lib/prisma";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";
import { getTranslations } from "next-intl/server";
import type { FriendshipStatus } from "@/types/friendship";

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
  const title = `Wishlist de @${user.username} sur Le Vestiaire`;
  const description = `Découvrez la wishlist de maillots de ${displayName} sur Le Vestiaire.`;
  const url = `https://levestiaire.app/u/${user.username}/wishlist`;

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

export default async function PublicWishlistPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();
  const { username: raw } = await params;
  const username = raw.toLowerCase();

  const t = await getTranslations("PublicCollection");

  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      leaderboardAnonymous: true,
      favoriteClub: { select: { id: true, name: true } },
      instagramHandle: true,
      twitterHandle: true,
      tiktokHandle: true,
      youtubeHandle: true,
      twitchHandle: true,
    },
  });

  if (!targetUser) notFound();

  const userId = targetUser.id;

  if (currentUser && userId === currentUser.id) {
    redirect("/wishlist");
  }

  const friendshipRaw = currentUser
    ? await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: userId },
            { senderId: userId, receiverId: currentUser.id },
          ],
        },
        select: { id: true, status: true, senderId: true },
      })
    : null;

  const isAnonymous = targetUser.leaderboardAnonymous ?? false;
  const displayName = isAnonymous
    ? t("anonymous")
    : targetUser.username ?? targetUser.name;

  let avatarUrl: string | null = null;
  if (!isAnonymous && targetUser.avatar) {
    avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, targetUser.avatar, 60 * 60);
  }

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId },
    select: {
      id: true,
      jerseyId: true,
      priority: true,
      createdAt: true,
      jersey: {
        include: {
          club: { include: { league: true } },
        },
      },
    },
    orderBy: { priority: "desc" },
  });

  const formattedWishlist = wishlistItems.map((item) => ({
    ...item,
    jersey: {
      ...item.jersey,
      retailPrice: item.jersey.retailPrice ? Number(item.jersey.retailPrice) : null,
    },
  }));

  const totalValue = formattedWishlist.reduce(
    (sum, item) => sum + (item.jersey.retailPrice || 0),
    0,
  );

  const leagueStats = formattedWishlist.reduce(
    (acc, item) => {
      const league = item.jersey.club.league.name;
      acc[league] = (acc[league] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const typeStats = formattedWishlist.reduce(
    (acc, item) => {
      acc[item.jersey.type] = (acc[item.jersey.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const priorityStats = formattedWishlist.reduce(
    (acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const stats = {
    total: formattedWishlist.length,
    totalValue: totalValue > 0 ? totalValue : null,
    leagueStats,
    typeStats,
    priorityStats,
  };

  const friendship =
    friendshipRaw && currentUser
      ? {
          id: friendshipRaw.id,
          status: friendshipRaw.status as FriendshipStatus,
          isSender: friendshipRaw.senderId === currentUser.id,
        }
      : null;

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      {!currentUser && <AuthGateBanner />}

      <div className="flex items-center gap-4">
        <BackButton href="/leaderboard" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Gift className="w-6 h-6 text-primary flex-shrink-0" />
          <h1 className="text-2xl font-semibold truncate">
            {t("wishlistTitle", { name: displayName })}
          </h1>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium flex-shrink-0">
            {stats.total} {stats.total > 1 ? t("jerseys") : t("jersey")}
          </span>
        </div>
      </div>

      <PublicUserTabs username={targetUser.username} />

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          {isAnonymous ? (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <EyeOff className="w-7 h-7 text-muted-foreground" />
            </div>
          ) : (
            <UserAvatar
              src={avatarUrl || undefined}
              name={targetUser.name}
              size="lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold truncate flex-1 min-w-0">
                {displayName}
              </h2>
              {currentUser && (
                <FriendshipButton
                  targetUserId={userId}
                  friendshipId={friendship?.id}
                  status={friendship?.status ?? null}
                  isSender={friendship?.isSender}
                  isAnonymous={isAnonymous}
                />
              )}
            </div>
            {!isAnonymous && targetUser.favoriteClub && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Heart className="w-4 h-4 text-red-500" />
                {targetUser.favoriteClub.name}
              </p>
            )}
            {!isAnonymous && (
              <div className="mt-2">
                <SocialLinksRow
                  instagramHandle={targetUser.instagramHandle}
                  twitterHandle={targetUser.twitterHandle}
                  tiktokHandle={targetUser.tiktokHandle}
                  youtubeHandle={targetUser.youtubeHandle}
                  twitchHandle={targetUser.twitchHandle}
                />
              </div>
            )}
            {!isAnonymous && targetUser.bio && (
              <p className="text-sm text-muted-foreground mt-2">
                {targetUser.bio}
              </p>
            )}
            {isAnonymous && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                {t("anonymousMessage")}
              </p>
            )}
          </div>
        </div>
      </div>

      <FriendWishlistStats stats={stats} />

      {formattedWishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Gift className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            {t("wishlistEmpty")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("wishlistEmptyMessage", { name: displayName })}
          </p>
        </div>
      ) : (
        <FriendWishlistGrid wishlistItems={formattedWishlist} />
      )}
    </div>
  );
}
