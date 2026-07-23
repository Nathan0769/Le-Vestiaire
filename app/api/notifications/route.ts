import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

const DEFAULT_LIMIT = 20;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const unreadOnly = searchParams.get("unread") === "1";
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) ||
      DEFAULT_LIMIT,
    50
  );

  // Fetch les FollowRequest pending seulement pour la 1ère page (cursor undefined).
  // Non paginées : elles apparaissent toutes en tête de liste.
  // Un cap de 100 protège contre un profil célébrité avec des milliers de demandes.
  const pendingRequests = cursor
    ? []
    : await prisma.followRequest.findMany({
        where: { targetId: user.id },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              avatar: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

  const rows = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  const followRequestItems = await Promise.all(
    pendingRequests.map(async (r) => {
      const avatarUrl = r.requester.avatar
        ? await getR2PresignedUrl(AVATARS_BUCKET, r.requester.avatar, 60 * 60)
        : null;
      return {
        id: `follow-req:${r.id}`,
        type: "FOLLOW_REQUEST_RECEIVED" as const,
        createdAt: r.createdAt,
        readAt: null,
        postId: null,
        commentId: null,
        followRequestId: r.id,
        actor: {
          id: r.requester.id,
          username: r.requester.username,
          name: r.requester.username,
          avatarUrl: avatarUrl ?? r.requester.image,
        },
      };
    })
  );

  const items = await Promise.all(
    sliced.map(async (n) => {
      let avatarUrl: string | null = null;
      if (n.actor?.avatar) {
        avatarUrl = await getR2PresignedUrl(
          AVATARS_BUCKET,
          n.actor.avatar,
          60 * 60
        );
      }
      return {
        id: n.id,
        type: n.type,
        createdAt: n.createdAt,
        readAt: n.readAt,
        postId: n.postId,
        commentId: n.commentId,
        actor: n.actor
          ? {
              id: n.actor.id,
              username: n.actor.username,
              name: n.actor.username,
              avatarUrl: avatarUrl ?? n.actor.image,
            }
          : null,
      };
    })
  );

  return NextResponse.json({
    items: [...followRequestItems, ...items],
    nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
  });
}
