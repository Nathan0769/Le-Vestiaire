import { getCurrentUser } from "@/lib/get-current-user";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z
  .object({
    targetType: z.enum(["POST", "COMMENT"]),
    postId: z.string().optional(),
    commentId: z.string().optional(),
    reason: z.enum([
      "SPAM",
      "HARASSMENT",
      "HATE_SPEECH",
      "INAPPROPRIATE",
      "OTHER",
    ]),
    details: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) =>
      (data.targetType === "POST" && data.postId) ||
      (data.targetType === "COMMENT" && data.commentId),
    { message: "postId requis pour POST, commentId pour COMMENT" }
  );

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.targetType === "POST" && data.postId) {
    const post = await prisma.post.findFirst({
      where: { id: data.postId, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }
    if (post.authorId === user.id) {
      return NextResponse.json(
        { error: "Impossible de signaler son propre post" },
        { status: 400 }
      );
    }
    const existing = await prisma.postReport.findFirst({
      where: { reporterId: user.id, postId: post.id },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Post déjà signalé" },
        { status: 409 }
      );
    }
  }

  if (data.targetType === "COMMENT" && data.commentId) {
    const comment = await prisma.postComment.findFirst({
      where: { id: data.commentId, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!comment) {
      return NextResponse.json(
        { error: "Commentaire introuvable" },
        { status: 404 }
      );
    }
    if (comment.authorId === user.id) {
      return NextResponse.json(
        { error: "Impossible de signaler son propre commentaire" },
        { status: 400 }
      );
    }
    const existing = await prisma.postReport.findFirst({
      where: { reporterId: user.id, commentId: comment.id },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Commentaire déjà signalé" },
        { status: 409 }
      );
    }
  }

  await prisma.postReport.create({
    data: {
      reporterId: user.id,
      targetType: data.targetType,
      postId: data.targetType === "POST" ? data.postId : null,
      commentId: data.targetType === "COMMENT" ? data.commentId : null,
      reason: data.reason,
      details: data.details ?? null,
    },
  });

  return NextResponse.json({ status: "reported" }, { status: 201 });
}
