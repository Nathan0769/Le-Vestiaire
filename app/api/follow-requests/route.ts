import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const LIMIT = 50;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  const requests = await prisma.followRequest.findMany({
    where: { targetId: user.id },
    include: {
      requester: {
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

  const hasMore = requests.length > LIMIT;
  const sliced = hasMore ? requests.slice(0, LIMIT) : requests;
  const items = sliced.map((r) => ({
    ...r,
    requester: { ...r.requester, name: r.requester.username },
  }));
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
