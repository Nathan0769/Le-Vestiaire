import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getFollowingIds,
  getBlockedIdsBothWays,
} from "@/lib/follow";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

const MIN_JERSEY_COUNT = 10;
const LIMIT = 5;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ items: [] });
  }

  const [followingIds, blockedIds] = await Promise.all([
    getFollowingIds(user.id),
    getBlockedIdsBothWays(user.id),
  ]);

  const excludeIds = [user.id, ...followingIds, ...blockedIds];

  // Users publics avec >= MIN_JERSEY_COUNT maillots, non déjà suivis
  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      isPrivate: false,
      leaderboardAnonymous: { not: true },
    },
    select: {
      id: true,
      username: true,
      avatar: true,
      image: true,
      favoriteClub: { select: { name: true } },
      _count: { select: { collection: true } },
    },
    orderBy: {
      collection: { _count: "desc" },
    },
    take: 20,
  });

  const filtered = candidates.filter(
    (c) => c._count.collection >= MIN_JERSEY_COUNT
  );

  // Shuffle légèrement puis limit pour éviter que ce soit toujours les mêmes
  const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, LIMIT);

  const items = await Promise.all(
    shuffled.map(async (u) => {
      const avatarUrl = u.avatar
        ? await getR2PresignedUrl(AVATARS_BUCKET, u.avatar, 60 * 60)
        : null;
      return {
        id: u.id,
        username: u.username,
        avatarUrl: avatarUrl ?? u.image,
        jerseyCount: u._count.collection,
        favoriteClubName: u.favoriteClub?.name ?? null,
      };
    })
  );

  return NextResponse.json({ items });
}
