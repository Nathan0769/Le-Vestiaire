import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/check-permission";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, deletedAt: true },
  });
  if (!post || post.deletedAt) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  const isOwner = post.authorId === user.id;
  const canModerate = hasPermission(user.role, { post: ["moderate"] });
  if (!isOwner && !canModerate) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { deletedAt: new Date() },
  });

  return new NextResponse(null, { status: 204 });
}
