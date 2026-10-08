import { getCurrentUser } from "@/lib/get-current-user";
import {
  socialActionRateLimit,
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { pushForNotification } from "@/lib/push/notify";
import { CommentError, createComment, listComments } from "@/lib/feed/comments";

const bodySchema = z.object({
  content: z.string().trim().min(1).max(500),
  parentId: z.string().min(1).max(64).nullish(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  const identifier = await getRateLimitIdentifier(user?.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  // Racines uniquement : les réponses se chargent à la demande via /replies.
  const page = await listComments({
    postId,
    parentId: null,
    viewerId: user?.id ?? null,
    cursor,
  });

  return NextResponse.json(page);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(socialActionRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Contenu invalide (1-500 caractères)" },
      { status: 400 }
    );
  }

  try {
    const { comment, pushes } = await createComment({
      postId,
      authorId: user.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    });

    for (const push of pushes) {
      await pushForNotification({
        recipientId: push.recipientId,
        actorId: user.id,
        type: push.type,
        postId,
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof CommentError) {
      switch (error.code) {
        case "POST_NOT_FOUND":
          return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
        case "PARENT_NOT_FOUND":
          return NextResponse.json(
            { error: "Commentaire introuvable" },
            { status: 404 }
          );
        default:
          return NextResponse.json(
            { error: "Interaction bloquée" },
            { status: 403 }
          );
      }
    }
    throw error;
  }
}
