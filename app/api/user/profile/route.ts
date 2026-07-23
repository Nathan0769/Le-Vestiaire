import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [user, collectionClubs, followingCount, followersCount, accountProviders] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          image: true,
          avatar: true,
          bio: true,
          plan: true,
          notificationsEnabled: true,
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

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      image: avatarUrl ?? user.image ?? null,
      bio: user.bio,
      isPro: user.plan === "PRO",
      notificationsEnabled: user.notificationsEnabled,
      hasPassword,
      favoriteClub: user.favoriteClub ?? null,
      createdAt: user.createdAt.toISOString(),
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
