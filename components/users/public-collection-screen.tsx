import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/get-current-user";
import { UserCollectionStats } from "@/components/users/public-collection/user-collection-stats";
import { UserCollectionGrid } from "@/components/users/public-collection/user-collection-grid";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { SocialLinksRow } from "@/components/profiles/social-links-row";
import { PublicUserTabs } from "@/components/users/public-user-tabs";
import { FollowButton } from "@/components/follow/follow-button";
import { AuthGateBanner } from "@/components/auth/auth-gate-banner";
import { TopAchievementsBadges } from "@/components/achievements/top-achievements-badges";
import { maybeCheckAllAchievements } from "@/lib/achievements/check";
import { pickTopAchievements } from "@/lib/achievements/top-achievements";
import { BackButton } from "@/components/ui/back-button";
import { Package, Heart, EyeOff } from "lucide-react";
import prisma from "@/lib/prisma";
import {
  getR2PresignedUrl,
  AVATARS_BUCKET,
  USER_JERSEY_PHOTOS_BUCKET,
} from "@/lib/r2-storage";
import { getTranslations } from "next-intl/server";
import type { FollowState } from "@/types/follow";

interface PublicCollectionScreenProps {
  userId: string;
  basePath: string;
}

export async function PublicCollectionScreen({
  userId,
  basePath,
}: PublicCollectionScreenProps) {
  const currentUser = await getCurrentUser();
  const t = await getTranslations("PublicCollection");

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
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

  if (currentUser && targetUser.id === currentUser.id) {
    redirect("/collection");
  }

  try {
    await maybeCheckAllAchievements(targetUser.id, null);
  } catch (error) {
    console.error("maybeCheckAllAchievements failed for target user:", error);
  }

  const [followState, myJerseyIds, topAchievementsRaw] = await Promise.all([
    currentUser
      ? Promise.all([
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: targetUser.id,
              },
            },
            select: { id: true },
          }),
          prisma.followRequest.findUnique({
            where: {
              requesterId_targetId: {
                requesterId: currentUser.id,
                targetId: targetUser.id,
              },
            },
            select: { id: true },
          }),
        ]).then(([follow, request]) => {
          if (follow) return "following" as FollowState;
          if (request) return "requested" as FollowState;
          return "none" as FollowState;
        })
      : Promise.resolve("none" as FollowState),
    currentUser
      ? prisma.userJersey.findMany({
          where: { userId: currentUser.id },
          select: { jerseyId: true },
        })
      : Promise.resolve([]),
    prisma.achievement.findMany({
      where: { userId: targetUser.id },
      select: { key: true, tier: true, unlockedAt: true, metadata: true },
    }),
  ]);

  const topAchievements = pickTopAchievements(topAchievementsRaw, 5);

  const isAnonymous = targetUser.leaderboardAnonymous ?? false;
  const displayName = isAnonymous
    ? t("anonymous")
    : targetUser.username ?? targetUser.name;

  let avatarUrl: string | null = null;
  if (!isAnonymous && targetUser.avatar) {
    avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, targetUser.avatar, 60 * 60);
  }

  const collectionItems = await prisma.userJersey.findMany({
    where: { userId: targetUser.id },
    select: {
      id: true,
      userId: true,
      jerseyId: true,
      version: true,
      size: true,
      condition: true,
      hasTags: true,
      playerName: true,
      playerNumber: true,
      purchasePrice: true,
      purchaseDate: true,
      notes: true,
      isGift: true,
      isFromMysteryBox: true,
      userPhotoUrl: true,
      isSigned: true,
      signedBy: true,
      hasAuthCertificate: true,
      certificateUrl: true,
      matchDescription: true,
      matchDate: true,
      hasLongSleeves: true,
      createdAt: true,
      updatedAt: true,
      patches: {
        select: {
          id: true,
          patchId: true,
          customLabel: true,
          patch: {
            select: {
              id: true,
              name: true,
              family: true,
              versions: {
                select: {
                  id: true,
                  seasonStart: true,
                  seasonEnd: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
      jersey: {
        include: {
          club: { include: { league: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const myJerseyIdSet = new Set(myJerseyIds.map((j) => j.jerseyId));

  const formattedCollection = await Promise.all(
    collectionItems.map(async (item) => {
      let userPhotoSignedUrl: string | null = null;
      if (item.userPhotoUrl) {
        userPhotoSignedUrl = await getR2PresignedUrl(
          USER_JERSEY_PHOTOS_BUCKET,
          item.userPhotoUrl,
          60 * 60,
        );
      }

      return {
        ...item,
        userPhotoUrl: userPhotoSignedUrl,
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        jersey: {
          ...item.jersey,
          retailPrice: item.jersey.retailPrice
            ? Number(item.jersey.retailPrice)
            : null,
        },
      };
    }),
  );

  const commonItems = formattedCollection.filter((item) =>
    myJerseyIdSet.has(item.jerseyId),
  );

  const leagueStats = collectionItems.reduce(
    (acc, item) => {
      const league = item.jersey.club.league.name;
      acc[league] = (acc[league] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const conditionStats = collectionItems.reduce(
    (acc, item) => {
      acc[item.condition] = (acc[item.condition] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const typeStats = collectionItems.reduce(
    (acc, item) => {
      acc[item.jersey.type] = (acc[item.jersey.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const giftCount = collectionItems.filter((item) => item.isGift).length;
  const mysteryBoxCount = collectionItems.filter(
    (item) => item.isFromMysteryBox,
  ).length;
  const regularCount = collectionItems.filter(
    (item) => !item.isGift && !item.isFromMysteryBox,
  ).length;

  const stats = {
    total: collectionItems.length,
    totalValue: null,
    leagueStats,
    conditionStats,
    typeStats,
    provenanceStats: {
      regular: regularCount,
      gifts: giftCount,
      mysteryBox: mysteryBoxCount,
    },
  };


  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      {!currentUser && <AuthGateBanner />}

      <div className="flex items-center gap-4">
        <BackButton href="/leaderboard" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Package className="w-6 h-6 text-primary shrink-0" />
          <h1 className="text-2xl font-semibold truncate">
            {t("title", { name: displayName })}
          </h1>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium shrink-0">
            {stats.total} {stats.total > 1 ? t("jerseys") : t("jersey")}
          </span>
        </div>
      </div>

      <PublicUserTabs basePath={basePath} />

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          {isAnonymous ? (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
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
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold truncate min-w-0">
                {displayName}
              </h2>
              {currentUser && !isAnonymous && (
                <div className="hidden md:block shrink-0">
                  <FollowButton
                    targetUserId={targetUser.id}
                    initialState={followState}
                    source="profile"
                  />
                </div>
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
            {currentUser && !isAnonymous && (
              <div className="mt-3 md:hidden">
                <FollowButton
                  targetUserId={targetUser.id}
                  initialState={followState}
                  source="profile"
                />
              </div>
            )}

            {!isAnonymous && topAchievements.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">
                  {t("topAchievements")}
                </p>
                <TopAchievementsBadges achievements={topAchievements} />
              </div>
            )}

            {commonItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-primary mb-2">
                  {t("commonJerseysTitle")} —{" "}
                  {t("commonJerseys", { count: commonItems.length })}
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

      <UserCollectionStats stats={stats} />

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
        <UserCollectionGrid
          collectionItems={formattedCollection}
          showPriceSortOptions={false}
        />
      )}
    </div>
  );
}
