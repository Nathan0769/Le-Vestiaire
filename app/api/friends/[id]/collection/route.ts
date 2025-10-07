import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { userId } = await params;

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

    const collectionItems = await prisma.userJersey.findMany({
      where: { userId },
      select: {
        id: true,
        jerseyId: true,
        size: true,
        condition: true,
        hasTags: true,
        personalization: true,
        purchasePrice: true,
        purchaseDate: true,
        isGift: true,
        isFromMysteryBox: true,
        createdAt: true,
        updatedAt: true,
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

    const formattedCollection = collectionItems.map((item) => ({
      ...item,
      purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
      jersey: {
        ...item.jersey,
        retailPrice: item.jersey.retailPrice
          ? Number(item.jersey.retailPrice)
          : null,
      },
    }));

    const totalJerseys = collectionItems.length;

    const totalValue = collectionItems.reduce((sum, item) => {
      return sum + (item.purchasePrice ? Number(item.purchasePrice) : 0);
    }, 0);

    const leagueStats = collectionItems.reduce((acc, item) => {
      const leagueName = item.jersey.club.league.name;
      acc[leagueName] = (acc[leagueName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conditionStats = collectionItems.reduce((acc, item) => {
      acc[item.condition] = (acc[item.condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeStats = collectionItems.reduce((acc, item) => {
      const type = item.jersey.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const giftCount = collectionItems.filter((item) => item.isGift).length;
    const mysteryBoxCount = collectionItems.filter(
      (item) => item.isFromMysteryBox
    ).length;
    const regularCount = collectionItems.filter(
      (item) => !item.isGift && !item.isFromMysteryBox
    ).length;

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
      collection: formattedCollection,
      stats: {
        total: totalJerseys,
        totalValue: totalValue > 0 ? totalValue : null,
        leagueStats,
        conditionStats,
        typeStats,
        provenanceStats: {
          regular: regularCount,
          gifts: giftCount,
          mysteryBox: mysteryBoxCount,
        },
      },
    });
  } catch (error) {
    console.error("Erreur GET friend collection:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
