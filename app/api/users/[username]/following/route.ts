import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { isSupporter } from "@/lib/subscription";
import { NextResponse } from "next/server";
import { getBlockedIdsBothWays } from "@/lib/follow";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

const LIMIT = 50;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const currentUser = await getCurrentUser();

  const identifier = await getRateLimitIdentifier(currentUser?.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, isPrivate: true },
  });

  if (!target) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  if (target.isPrivate && currentUser?.id !== target.id) {
    const isFollower = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser?.id ?? "",
          followingId: target.id,
        },
      },
      select: { id: true },
    });
    if (!isFollower) {
      return NextResponse.json({ error: "Profil privé" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  const blockedIds = currentUser
    ? await getBlockedIdsBothWays(currentUser.id)
    : [];

  const rows = await prisma.follow.findMany({
    where: {
      followerId: target.id,
      ...(blockedIds.length > 0
        ? { followingId: { notIn: blockedIds } }
        : {}),
      following: { leaderboardAnonymous: { not: true } },
    },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
          plan: true,
          avatarFrame: true,
          isPrivate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > LIMIT;
  const sliced = hasMore ? rows.slice(0, LIMIT) : rows;

  // followState du viewer sur chaque ligne : 2 requêtes batch (pas de N+1).
  const listedIds = sliced.map((r) => r.following.id);
  const followingSet = new Set<string>();
  const requestedSet = new Set<string>();
  if (currentUser && listedIds.length > 0) {
    const [follows, requests] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: currentUser.id, followingId: { in: listedIds } },
        select: { followingId: true },
      }),
      prisma.followRequest.findMany({
        where: { requesterId: currentUser.id, targetId: { in: listedIds } },
        select: { targetId: true },
      }),
    ]);
    follows.forEach((f) => followingSet.add(f.followingId));
    requests.forEach((r) => requestedSet.add(r.targetId));
  }

  const items = await Promise.all(
    sliced.map(async (r) => {
      const u = r.following;
      // avatarUrl résolu pour le mobile : presigned R2, fallback image Google.
      const avatarUrl = u.avatar
        ? await getR2PresignedUrl(AVATARS_BUCKET, u.avatar, 60 * 60)
        : (u.image ?? null);
      const followState: "none" | "following" | "requested" | "self" =
        currentUser?.id === u.id
          ? "self"
          : followingSet.has(u.id)
            ? "following"
            : requestedSet.has(u.id)
              ? "requested"
              : "none";
      return {
        ...u,
        name: u.username,
        avatarUrl,
        isSupporter: isSupporter(u),
        followState,
      };
    })
  );
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
