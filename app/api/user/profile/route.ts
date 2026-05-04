import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [user, collectionClubs, friendsCount] = await Promise.all([
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
      // Clubs distincts dans la collection
      prisma.userJersey.findMany({
        where: { userId: sessionUser.id },
        select: { jersey: { select: { clubId: true } } },
      }),
      // Amis acceptés
      prisma.friendship.count({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }],
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const clubsCount = new Set(collectionClubs.map((uj) => uj.jersey.clubId)).size;

    let avatarUrl = null;
    if (user.avatar) {
      const { data } = await supabaseAdmin.storage
        .from("avatar")
        .createSignedUrl(user.avatar, 60 * 60);
      avatarUrl = data?.signedUrl ?? null;
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      image: avatarUrl ?? user.image ?? null,
      bio: user.bio,
      isPro: user.plan === "PRO",
      favoriteClub: user.favoriteClub ?? null,
      createdAt: user.createdAt.toISOString(),
      stats: {
        collectionCount: user._count.collection,
        wishlistCount: user._count.wishlist,
        ratingsCount: user._count.ratings,
        clubsCount,
        friendsCount,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/user/profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
