import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  const { userId: targetId } = await params;

  if (targetId === user.id) {
    return NextResponse.json(
      { error: "Impossible de se bloquer soi-même" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: target.id,
        },
      },
      create: { blockerId: user.id, blockedId: target.id },
      update: {},
    });
    await tx.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followingId: target.id },
          { followerId: target.id, followingId: user.id },
        ],
      },
    });
    await tx.followRequest.deleteMany({
      where: {
        OR: [
          { requesterId: user.id, targetId: target.id },
          { requesterId: target.id, targetId: user.id },
        ],
      },
    });
  });

  return new NextResponse(null, { status: 204 });
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
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  const { userId: targetId } = await params;

  await prisma.block.deleteMany({
    where: { blockerId: user.id, blockedId: targetId },
  });

  return new NextResponse(null, { status: 204 });
}
