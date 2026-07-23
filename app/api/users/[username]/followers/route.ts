import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getBlockedIdsBothWays } from "@/lib/follow";

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
      followingId: target.id,
      ...(blockedIds.length > 0 ? { followerId: { notIn: blockedIds } } : {}),
      follower: { leaderboardAnonymous: { not: true } },
    },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > LIMIT;
  const sliced = hasMore ? rows.slice(0, LIMIT) : rows;
  const items = sliced.map((r) => ({
    ...r.follower,
    name: r.follower.username,
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
