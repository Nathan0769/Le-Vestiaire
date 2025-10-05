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

    const pendingRequests = await prisma.friendship.findMany({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const requests = await Promise.all(
      pendingRequests.map(async (request) => {
        let avatarUrl = null;
        if (request.sender.avatar) {
          const { data } = await supabaseAdmin.storage
            .from("avatar")
            .createSignedUrl(request.sender.avatar, 60 * 60);
          avatarUrl = data?.signedUrl || null;
        }

        return {
          id: request.id,
          sender: {
            id: request.sender.id,
            username: request.sender.username,
            name: request.sender.name,
            avatar: request.sender.avatar,
            avatarUrl,
            bio: request.sender.bio,
          },
          status: request.status,
          createdAt: request.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Erreur GET pending:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
