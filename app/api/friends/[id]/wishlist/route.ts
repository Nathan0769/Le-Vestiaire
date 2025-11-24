import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: userId } = await params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: userId, status: "ACCEPTED" },
          { senderId: userId, receiverId: currentUser.id, status: "ACCEPTED" },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Vous devez être ami avec cet utilisateur" },
        { status: 403 }
      );
    }

    const friendUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        favoriteClub: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!friendUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    let avatarUrl = null;
    if (friendUser.avatar) {
      const { data } = await supabaseAdmin.storage
        .from("avatar")
        .createSignedUrl(friendUser.avatar, 60 * 60);
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
            club: {
              include: {
                league: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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

    const totalItems = wishlistItems.length;
    const totalValue = wishlistItems.reduce(
      (sum, item) =>
        sum + (item.jersey.retailPrice ? Number(item.jersey.retailPrice) : 0),
      0
    );

    const leagueStats = wishlistItems.reduce((acc, item) => {
      const leagueName = item.jersey.club.league.name;
      acc[leagueName] = (acc[leagueName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeStats = wishlistItems.reduce((acc, item) => {
      const type = item.jersey.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityStats = wishlistItems.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json({
      user: {
        id: friendUser.id,
        username: friendUser.username,
        name: friendUser.name,
        avatar: friendUser.avatar,
        avatarUrl,
        bio: friendUser.bio,
        favoriteClub: friendUser.favoriteClub || null,
      },
      wishlist: formattedWishlist,
      stats: {
        total: totalItems,
        totalValue: totalValue > 0 ? totalValue : null,
        leagueStats,
        typeStats,
        priorityStats,
      },
    });
  } catch (error) {
    console.error("Erreur GET friend wishlist:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
