import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const blockedRelations = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: user.id, status: "BLOCKED" },
          { receiverId: user.id, status: "BLOCKED" },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    const blockedIds = blockedRelations.flatMap((rel) => [
      rel.senderId,
      rel.receiverId,
    ]);
    const uniqueBlockedIds = [...new Set(blockedIds)].filter(
      (id) => id !== user.id
    );

    const foundUsers = await prisma.user.findMany({
      where: {
        AND: [
          { username: { contains: query, mode: "insensitive" } },
          { id: { not: user.id } },
          { id: { notIn: uniqueBlockedIds } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
      },
      take: 10,
      orderBy: {
        username: "asc",
      },
    });

    const usersWithStatus = await Promise.all(
      foundUsers.map(async (foundUser) => {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: foundUser.id },
              { senderId: foundUser.id, receiverId: user.id },
            ],
          },
        });

        let avatarUrl = null;
        if (foundUser.avatar) {
          const { data } = await supabaseAdmin.storage
            .from("avatar")
            .createSignedUrl(foundUser.avatar, 60 * 60);
          avatarUrl = data?.signedUrl || null;
        }

        return {
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          avatar: foundUser.avatar,
          avatarUrl,
          bio: foundUser.bio,
          friendshipStatus: friendship?.status || null,
        };
      })
    );

    return NextResponse.json({ users: usersWithStatus });
  } catch (error) {
    console.error("Erreur search:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
