import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(Math.max(Number(limitParam || 20), 1), 50);

    // Compteur total pour badge/ETag
    const pendingCount = await prisma.friendship.count({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
    });

    // Récupère l'élément le plus récent pour stabiliser l'ETag
    const latest = await prisma.friendship.findFirst({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
      orderBy: { id: "desc" },
      select: { id: true, updatedAt: true },
    });

    const etagBase = JSON.stringify({
      c: pendingCount,
      l: latest ? `${latest.id}:${latest.updatedAt.toISOString()}` : "none",
    });
    const etag = createHash("sha1").update(etagBase).digest("hex");

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    const pendingPage = await prisma.friendship.findMany({
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
            favoriteClub: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = pendingPage.length > limit;
    const pageItems = hasMore ? pendingPage.slice(0, limit) : pendingPage;
    const nextCursor = hasMore
      ? pageItems[pageItems.length - 1]?.id ?? null
      : null;

    const requests = await Promise.all(
      pageItems.map(async (request) => {
        let avatarUrl = null as string | null;
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
            favoriteClub: request.sender.favoriteClub || null,
          },
          status: request.status,
          createdAt: request.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json(
      { requests, nextCursor, pendingCount },
      { headers: { ETag: etag } }
    );
  } catch (error) {
    console.error("Erreur GET pending:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
