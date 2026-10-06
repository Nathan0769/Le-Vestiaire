import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";
import { pickTopAchievements } from "@/lib/achievements/top-achievements";
import { getBadgeUrl } from "@/lib/achievements/badge-url";
import { ACHIEVEMENTS, isKnownAchievementKey } from "@/lib/achievements/definitions";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [user, collectionClubs, followingCount, followersCount, accountProviders, achievementsRaw] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          usernameGenerated: true,
          image: true,
          avatar: true,
          bio: true,
          plan: true,
          isPrivate: true,
          notificationsEnabled: true,
          disabledPushTypes: true,
          createdAt: true,
          favoriteClub: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true,
              primaryColor: true,
              league: {
                select: {
                  id: true,
                  name: true,
                  country: true,
                  logoUrl: true,
                  tier: true,
                },
              },
            },
          },
          _count: {
            select: {
              collection: true,
              wishlist: true,
              ratings: true,
            },
          },
        },
      }),
      prisma.userJersey.findMany({
        where: { userId: sessionUser.id },
        select: { jersey: { select: { clubId: true } } },
      }),
      prisma.follow.count({ where: { followerId: sessionUser.id } }),
      prisma.follow.count({ where: { followingId: sessionUser.id } }),
      prisma.account.findMany({
        where: { userId: sessionUser.id },
        select: { providerId: true },
      }),
      prisma.achievement.findMany({
        where: { userId: sessionUser.id },
        orderBy: { unlockedAt: "desc" },
        select: { key: true, tier: true, unlockedAt: true, metadata: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const clubsCount = new Set(collectionClubs.map((uj) => uj.jersey.clubId)).size;

    let avatarUrl = null;
    if (user.avatar) {
      avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, user.avatar, 60 * 60);
    }

    const hasPassword = accountProviders.some((a) => a.providerId === "credential");

    // Aperçu succès pour le teaser du profil (parité bloc web TopAchievementsBadges).
    const knownAchievements = achievementsRaw.filter((a) =>
      isKnownAchievementKey(a.key)
    );
    const topAchievements = pickTopAchievements(knownAchievements, 4).map(
      (a) => ({ key: a.key, tier: a.tier, imageUrl: getBadgeUrl(a.key) })
    );

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      usernameGenerated: user.usernameGenerated,
      image: avatarUrl,
      bio: user.bio,
      isSupporter: user.plan === "PRO",
      isPrivate: user.isPrivate,
      notificationsEnabled: user.notificationsEnabled,
      disabledPushTypes: user.disabledPushTypes,
      hasPassword,
      favoriteClub: user.favoriteClub ?? null,
      createdAt: user.createdAt.toISOString(),
      topAchievements,
      achievementsUnlockedCount: knownAchievements.length,
      achievementsTotal: Object.keys(ACHIEVEMENTS).length,
      stats: {
        collectionCount: user._count.collection,
        wishlistCount: user._count.wishlist,
        ratingsCount: user._count.ratings,
        clubsCount,
        followingCount,
        followersCount,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/user/profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
