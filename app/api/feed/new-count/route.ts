import { getCurrentUser } from "@/lib/get-current-user";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getFollowingIds, getBlockedIdsBothWays } from "@/lib/follow";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ count: 0 });
  }

  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  if (!since || Number.isNaN(since.getTime())) {
    return NextResponse.json({ count: 0 });
  }

  const [followingIds, blockedIds] = await Promise.all([
    getFollowingIds(user.id),
    getBlockedIdsBothWays(user.id),
  ]);
  const allowedAuthorIds = followingIds.filter(
    (id) => !blockedIds.includes(id)
  );
  if (allowedAuthorIds.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.post.count({
    where: {
      authorId: { in: allowedAuthorIds },
      createdAt: { gt: since },
      deletedAt: null,
    },
  });

  return NextResponse.json({ count });
}
