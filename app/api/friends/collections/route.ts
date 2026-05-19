import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: user.id, status: "ACCEPTED" },
          { receiverId: user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: {
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
        },
        receiver: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const friendsData = await Promise.all(
      friendships.map(async (friendship) => {
        const friend =
          friendship.senderId === user.id
            ? friendship.receiver
            : friendship.sender;

        let avatarUrl = null;
        if (friend.avatar) {
          avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, friend.avatar, 60 * 60);
        }

        return {
          friendshipId: friendship.id,
          userId: friend.id,
          username: friend.username,
          name: friend.name,
          avatar: friend.avatar,
          avatarUrl,
          bio: friend.bio,
          favoriteClub: friend.favoriteClub || null,
        };
      })
    );

    const sortKey = (u: { username?: string | null; name?: string | null }) =>
      u.username?.trim() || u.name?.trim() || "";

    friendsData.sort((a, b) =>
      sortKey(a).localeCompare(sortKey(b), "fr", { sensitivity: "base" })
    );

    return NextResponse.json({ friends: friendsData });
  } catch (error) {
    console.error("Erreur GET friends collections:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
