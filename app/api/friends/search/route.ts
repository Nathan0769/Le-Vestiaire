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
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Nom d'utilisateur manquant" },
        { status: 400 }
      );
    }

    const foundUser = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
      },
    });

    if (!foundUser) {
      return NextResponse.json({ user: null });
    }

    if (foundUser.id === user.id) {
      return NextResponse.json({ user: null });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: foundUser.id },
          { senderId: foundUser.id, receiverId: user.id },
        ],
      },
    });

    if (friendship?.status === "BLOCKED") {
      return NextResponse.json({ user: null });
    }

    let avatarUrl = null;
    if (foundUser.avatar) {
      const { data } = await supabaseAdmin.storage
        .from("avatar")
        .createSignedUrl(foundUser.avatar, 60 * 60);
      avatarUrl = data?.signedUrl || null;
    }

    return NextResponse.json({
      user: {
        id: foundUser.id,
        username: foundUser.username,
        name: foundUser.name,
        avatar: foundUser.avatar,
        avatarUrl,
        bio: foundUser.bio,
        friendshipStatus: friendship?.status || null,
      },
    });
  } catch (error) {
    console.error("Erreur search:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
