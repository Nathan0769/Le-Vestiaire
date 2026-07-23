import { getCurrentUser } from "@/lib/get-current-user";
import {
  socialActionRateLimit,
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isBlocked } from "@/lib/follow";
import { createNotification } from "@/lib/notifications/create";
import { checkAchievements } from "@/lib/achievements/check";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(socialActionRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  const { userId: targetId } = await params;

  if (targetId === user.id) {
    return NextResponse.json(
      { error: "Impossible de se suivre soi-même" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, isPrivate: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  if (await isBlocked(user.id, targetId)) {
    return NextResponse.json({ error: "Interaction bloquée" }, { status: 403 });
  }

  if (target.isPrivate) {
    await prisma.followRequest.upsert({
      where: {
        requesterId_targetId: { requesterId: user.id, targetId: target.id },
      },
      create: { requesterId: user.id, targetId: target.id },
      update: {},
    });
    return NextResponse.json({ status: "requested" });
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: user.id,
        followingId: target.id,
      },
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.$transaction(async (tx) => {
      await tx.follow.create({
        data: { followerId: user.id, followingId: target.id },
      });
      await createNotification(
        {
          userId: target.id,
          type: "NEW_FOLLOWER",
          actorId: user.id,
        },
        tx
      );
    });
    try {
      await checkAchievements(target.id, "social.follower");
    } catch (err) {
      console.error("checkAchievements social.follower failed:", err);
    }
  }

  return NextResponse.json({ status: "following" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
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

  const { userId: targetId } = await params;

  await prisma.follow.deleteMany({
    where: { followerId: user.id, followingId: targetId },
  });

  await prisma.followRequest.deleteMany({
    where: { requesterId: user.id, targetId },
  });

  return new NextResponse(null, { status: 204 });
}
