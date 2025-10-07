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
          const { data } = await supabaseAdmin.storage
            .from("avatar")
            .createSignedUrl(friend.avatar, 60 * 60);
          avatarUrl = data?.signedUrl || null;
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

    friendsData.sort((a, b) =>
      a.username.localeCompare(b.username, "fr", { sensitivity: "base" })
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
