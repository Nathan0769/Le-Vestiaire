import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { FriendWishlistStats } from "@/components/friends/friend-wishlist-stats";
import { FriendWishlistGrid } from "@/components/friends/friend-wishlist-grid";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { PublicUserTabs } from "@/components/users/public-user-tabs";
import { FriendshipButton } from "@/components/users/friendship-button";
import { BackButton } from "@/components/ui/back-button";
import { Gift, Heart, EyeOff } from "lucide-react";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTranslations } from "next-intl/server";
import type { FriendshipStatus } from "@/types/friendship";

export const dynamic = "force-dynamic";

interface PublicWishlistPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PublicWishlistPageProps) {
  const t = await getTranslations("PublicCollection");
  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true, leaderboardAnonymous: true },
  });

  if (!user) return { title: "Le Vestiaire" };

  const displayName = user.leaderboardAnonymous
    ? t("anonymous")
    : (user.username ?? user.name);

  return { title: `${t("wishlistTitle", { name: displayName })} - Le Vestiaire` };
}

export default async function PublicWishlistPage({
  params,
}: PublicWishlistPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/login");
  }

  const t = await getTranslations("PublicCollection");
  const { id: userId } = await params;

  if (userId === currentUser.id) {
    redirect("/wishlist");
  }

  const [targetUser, friendshipRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        leaderboardAnonymous: true,
        favoriteClub: { select: { id: true, name: true } },
      },
    }),
    prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: userId },
          { senderId: userId, receiverId: currentUser.id },
        ],
      },
      select: { id: true, status: true, senderId: true },
    }),
  ]);

  if (!targetUser) {
    notFound();
  }

  const isAnonymous = targetUser.leaderboardAnonymous;
  const displayName = isAnonymous
    ? t("anonymous")
    : (targetUser.username ?? targetUser.name);

  let avatarUrl: string | null = null;
  if (!isAnonymous && targetUser.avatar) {
    const { data } = await supabaseAdmin.storage
      .from("avatar")
      .createSignedUrl(targetUser.avatar, 60 * 60);
    avatarUrl = data?.signedUrl || null;
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
      retailPrice: item.jersey.retailPrice
        ? Number(item.jersey.retailPrice)
        : null,
    },
  }));

  const totalValue = formattedWishlist.reduce(
    (sum, item) => sum + (item.jersey.retailPrice || 0),
    0
  );

  const leagueStats = formattedWishlist.reduce((acc, item) => {
    const league = item.jersey.club.league.name;
    acc[league] = (acc[league] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeStats = formattedWishlist.reduce((acc, item) => {
    acc[item.jersey.type] = (acc[item.jersey.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityStats = formattedWishlist.reduce((acc, item) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const stats = {
    total: formattedWishlist.length,
    totalValue: totalValue > 0 ? totalValue : null,
    leagueStats,
    typeStats,
    priorityStats,
  };

  const friendship = friendshipRaw
    ? {
        id: friendshipRaw.id,
        status: friendshipRaw.status as FriendshipStatus,
        isSender: friendshipRaw.senderId === currentUser.id,
      }
    : null;

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
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

      <PublicUserTabs userId={userId} />

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
              <h2 className="text-xl font-semibold truncate flex-1 min-w-0">{displayName}</h2>
              <FriendshipButton
                targetUserId={userId}
                friendshipId={friendship?.id}
                status={friendship?.status ?? null}
                isSender={friendship?.isSender}
                isAnonymous={isAnonymous}
              />
            </div>
            {!isAnonymous && targetUser.favoriteClub && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Heart className="w-4 h-4 text-red-500" />
                {targetUser.favoriteClub.name}
              </p>
            )}
            {!isAnonymous && targetUser.bio && (
              <p className="text-sm text-muted-foreground mt-2">{targetUser.bio}</p>
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
