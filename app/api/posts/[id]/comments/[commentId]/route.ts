import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

const patchSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

interface Ctx {
  params: Promise<{ id: string; commentId: string }>;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { commentId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Contenu invalide (1-500 caractères)" },
      { status: 400 }
    );
  }

  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, createdAt: true, deletedAt: true },
  });
  if (!comment || comment.deletedAt) {
    return NextResponse.json(
      { error: "Commentaire introuvable" },
      { status: 404 }
    );
  }

  if (comment.authorId !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
    return NextResponse.json(
      { error: "Fenêtre d'édition expirée (15 min)" },
      { status: 403 }
    );
  }

  const updated = await prisma.postComment.update({
    where: { id: commentId },
    data: { content: parsed.data.content },
  });

  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { commentId } = await params;

  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, postId: true, deletedAt: true },
  });
  if (!comment || comment.deletedAt) {
    return NextResponse.json(
      { error: "Commentaire introuvable" },
      { status: 404 }
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: comment.postId },
    select: { authorId: true },
  });

  const isOwnComment = comment.authorId === user.id;
  const isPostOwner = post?.authorId === user.id;
  if (!isOwnComment && !isPostOwner) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.postComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
    // Decrement conditionnel : évite un compteur négatif si le comment était déjà
    // soft-deleted (par la modération admin par ex).
    await tx.post.updateMany({
      where: { id: comment.postId, commentCount: { gt: 0 } },
      data: { commentCount: { decrement: 1 } },
    });
  });

  return new NextResponse(null, { status: 204 });
}
