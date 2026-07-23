import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/check-permission";
import { enrichPostsForFeed } from "@/lib/feed/enrich-posts";
import { isBlocked } from "@/lib/follow";

export async function GET(
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
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId } = await params;

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  // Gate block bidirectionnel
  if (user.id !== post.authorId && (await isBlocked(user.id, post.authorId))) {
    return NextResponse.json({ error: "Accès bloqué" }, { status: 403 });
  }

  // Gate privacy : profil privé accessible seulement à l'auteur ou ses followers
  if (user.id !== post.authorId) {
    const author = await prisma.user.findUnique({
      where: { id: post.authorId },
      select: { isPrivate: true },
    });
    if (author?.isPrivate) {
      const follows = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: post.authorId,
          },
        },
        select: { id: true },
      });
      if (!follows) {
        return NextResponse.json({ error: "Profil privé" }, { status: 403 });
      }
    }
  }

  const [enriched] = await enrichPostsForFeed([post], user.id);
  return NextResponse.json({ post: enriched ?? null });
}

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
