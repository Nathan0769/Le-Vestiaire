import { getCurrentUser } from "@/lib/get-current-user";
import {
  socialActionRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canInteract } from "@/lib/follow";
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
  const rateLimitResult = await checkRateLimit(socialActionRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id: postId } = await params;

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true, authorId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }

  if (!(await canInteract(user.id, post.authorId))) {
    return NextResponse.json({ error: "Interaction bloquée" }, { status: 403 });
  }

  // Toggle atomique : findUnique + create/delete dans la même transaction pour
  // éviter les race conditions sur double-click. Isolation Serializable protège
  // contre les TOCTOU (2 transactions concurrentes voient toutes deux "pas liké").
  const result = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.postLike.findUnique({
        where: {
          postId_userId: { postId: post.id, userId: user.id },
        },
        select: { id: true },
      });

      if (existing) {
        await tx.postLike.delete({ where: { id: existing.id } });
        // Decrement conditionnel : jamais < 0 même en cas d'incohérence.
        await tx.post.updateMany({
          where: { id: post.id, likeCount: { gt: 0 } },
          data: { likeCount: { decrement: 1 } },
        });
        const updated = await tx.post.findUnique({
          where: { id: post.id },
          select: { likeCount: true },
        });
        return { hasLiked: false, likeCount: updated?.likeCount ?? 0 };
      }

      await tx.postLike.create({
        data: { postId: post.id, userId: user.id },
      });
      const updated = await tx.post.update({
        where: { id: post.id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      await createNotification(
        {
          userId: post.authorId,
          type: "POST_LIKED",
          actorId: user.id,
          postId: post.id,
        },
        tx
      );
      return { hasLiked: true, likeCount: updated.likeCount };
    },
    { isolationLevel: "Serializable" }
  );

  return NextResponse.json(result);
}
