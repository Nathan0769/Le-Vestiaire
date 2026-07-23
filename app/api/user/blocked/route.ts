import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";
import { NextResponse } from "next/server";

export async function GET() {
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

  const rows = await prisma.block.findMany({
    where: { blockerId: user.id },
    include: {
      blocked: {
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
  });

  const items = await Promise.all(
    rows.map(async (r) => ({
      id: r.blocked.id,
      username: r.blocked.username,
      name: r.blocked.username,
      avatar: r.blocked.avatar,
      image: r.blocked.image,
      avatarUrl: r.blocked.avatar
        ? await getR2PresignedUrl(AVATARS_BUCKET, r.blocked.avatar, 60 * 60)
        : null,
    }))
  );

  return NextResponse.json({ items });
}
