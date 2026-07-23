import { requirePermission } from "@/lib/check-permission";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PostReportStatus } from "@prisma/client";

const bodySchema = z.object({
  action: z.enum(["keep", "remove"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission({ postReport: ["manage"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const { id } = await params;

  const report = await prisma.postReport.findUnique({
    where: { id },
    select: {
      id: true,
      postId: true,
      commentId: true,
      status: true,
    },
  });
  if (!report) {
    return NextResponse.json(
      { error: "Signalement introuvable" },
      { status: 404 }
    );
  }

  if (report.status !== PostReportStatus.PENDING) {
    return NextResponse.json(
      { error: "Signalement déjà traité" },
      { status: 400 }
    );
  }

  const now = new Date();
  const newStatus =
    parsed.data.action === "remove"
      ? PostReportStatus.REVIEWED_REMOVED
      : PostReportStatus.REVIEWED_KEPT;

  await prisma.$transaction(async (tx) => {
    // Soft-delete du target si "remove"
    if (parsed.data.action === "remove") {
      if (report.postId) {
        await tx.post.update({
          where: { id: report.postId },
          data: { deletedAt: now },
        });
      } else if (report.commentId) {
        const comment = await tx.postComment.findUnique({
          where: { id: report.commentId },
          select: { postId: true, deletedAt: true },
        });
        if (comment && !comment.deletedAt) {
          await tx.postComment.update({
            where: { id: report.commentId },
            data: { deletedAt: now },
          });
          await tx.post.update({
            where: { id: comment.postId },
            data: { commentCount: { decrement: 1 } },
          });
        }
      }
    }

    // Marquer tous les signalements pending sur le même target comme reviewed
    // (évite la file redondante)
    await tx.postReport.updateMany({
      where: {
        status: PostReportStatus.PENDING,
        ...(report.postId
          ? { postId: report.postId }
          : { commentId: report.commentId! }),
      },
      data: {
        status: newStatus,
        reviewedById: session!.user.id,
        reviewedAt: now,
      },
    });
  });

  return NextResponse.json({ status: "reviewed" });
}
