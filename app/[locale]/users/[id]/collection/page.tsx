import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { FriendCollectionStats } from "@/components/friends/friend-collection-stats";
import { FriendCollectionGrid } from "@/components/friends/friend-collection-grid";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { PublicUserTabs } from "@/components/users/public-user-tabs";
import { FriendshipButton } from "@/components/users/friendship-button";
import { BackButton } from "@/components/ui/back-button";
import { Package, Heart, EyeOff } from "lucide-react";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { FriendshipStatus } from "@/types/friendship";

interface PublicCollectionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PublicCollectionPageProps) {
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

  return { title: `${t("title", { name: displayName })} - Le Vestiaire` };
}

export default async function PublicCollectionPage({
  params,
}: PublicCollectionPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/login");
  }

  const t = await getTranslations("PublicCollection");
  const { id: userId } = await params;

  if (userId === currentUser.id) {
    redirect("/collection");
  }

  const [targetUser, friendshipRaw, myJerseyIds] = await Promise.all([
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
    prisma.userJersey.findMany({
      where: { userId: currentUser.id },
      select: { jerseyId: true },
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

  const collectionItems = await prisma.userJersey.findMany({
    where: { userId },
    select: {
      id: true,
      jerseyId: true,
      size: true,
      condition: true,
      hasTags: true,
      personalization: true,
      notes: true,
      isGift: true,
      isFromMysteryBox: true,
      createdAt: true,
      updatedAt: true,
      jersey: {
        include: {
          club: { include: { league: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const myJerseyIdSet = new Set(myJerseyIds.map((j) => j.jerseyId));

  const formattedCollection = collectionItems.map((item) => ({
    ...item,
    userPhotoUrl: null,
    purchasePrice: null,
    purchaseDate: null,
    jersey: {
      ...item.jersey,
      retailPrice: item.jersey.retailPrice
        ? Number(item.jersey.retailPrice)
        : null,
    },
  }));

  const commonItems = formattedCollection.filter((item) =>
    myJerseyIdSet.has(item.jerseyId)
  );

  const leagueStats = collectionItems.reduce((acc, item) => {
    const league = item.jersey.club.league.name;
    acc[league] = (acc[league] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conditionStats = collectionItems.reduce((acc, item) => {
    acc[item.condition] = (acc[item.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeStats = collectionItems.reduce((acc, item) => {
    acc[item.jersey.type] = (acc[item.jersey.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const giftCount = collectionItems.filter((item) => item.isGift).length;
  const mysteryBoxCount = collectionItems.filter(
    (item) => item.isFromMysteryBox
  ).length;
  const regularCount = collectionItems.filter(
    (item) => !item.isGift && !item.isFromMysteryBox
  ).length;

  const stats = {
    total: collectionItems.length,
    totalValue: null,
    leagueStats,
    conditionStats,
    typeStats,
    provenanceStats: { regular: regularCount, gifts: giftCount, mysteryBox: mysteryBoxCount },
  };

  const friendship = friendshipRaw
    ? {
        id: friendshipRaw.id,
        status: friendshipRaw.status as FriendshipStatus,
        isSender: friendshipRaw.senderId === currentUser.id,
      }
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/leaderboard" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Package className="w-6 h-6 text-primary flex-shrink-0" />
          <h1 className="text-2xl font-semibold truncate">
            {t("title", { name: displayName })}
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
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold truncate">{displayName}</h2>
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

            {commonItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-primary mb-2">
                  {t("commonJerseysTitle")} — {t("commonJerseys", { count: commonItems.length })}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {commonItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="w-12 h-12 relative rounded-md overflow-hidden border border-border bg-muted"
                    >
                      <Image
                        src={item.jersey.imageUrl}
                        alt={item.jersey.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ))}
                  {commonItems.length > 5 && (
                    <div className="w-12 h-12 rounded-md border border-border bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        +{commonItems.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FriendCollectionStats stats={stats} />

      {formattedCollection.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            {t("emptyTitle")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("emptyMessage", { name: displayName })}
          </p>
        </div>
      ) : (
        <FriendCollectionGrid
          collectionItems={formattedCollection}
          showPriceSortOptions={false}
        />
      )}
    </div>
  );
}
