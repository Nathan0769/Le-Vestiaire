import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkAchievements } from "@/lib/achievements/check";
import { createNotification } from "@/lib/notifications/create";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const request = await prisma.followRequest.findUnique({
    where: { id },
    select: { id: true, requesterId: true, targetId: true },
  });

  if (!request) {
    return NextResponse.json(
      { error: "Demande introuvable" },
      { status: 404 }
    );
  }

  if (request.targetId !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.followRequest.delete({ where: { id: request.id } });
    await tx.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: request.requesterId,
          followingId: request.targetId,
        },
      },
      create: {
        followerId: request.requesterId,
        followingId: request.targetId,
      },
      update: {},
    });
    await createNotification(
      {
        userId: request.requesterId,
        type: "FOLLOW_REQUEST_APPROVED",
        actorId: request.targetId,
      },
      tx
    );
  });

  try {
    await checkAchievements(request.targetId, "social.follower");
  } catch (err) {
    console.error("checkAchievements social.follower failed:", err);
  }

  return NextResponse.json({ status: "accepted" });
}
