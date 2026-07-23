import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PostReportStatus, PostReportTargetType } from "@prisma/client";

export async function GET(request: Request) {
  const { error, session } = await requirePermission({ postReport: ["list"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && Object.values(PostReportStatus).includes(statusParam as PostReportStatus)
      ? (statusParam as PostReportStatus)
      : PostReportStatus.PENDING;

  const targetTypeParam = searchParams.get("targetType");
  const targetType =
    targetTypeParam &&
    Object.values(PostReportTargetType).includes(
      targetTypeParam as PostReportTargetType
    )
      ? (targetTypeParam as PostReportTargetType)
      : undefined;

  const reports = await prisma.postReport.findMany({
    where: {
      status,
      ...(targetType ? { targetType } : {}),
    },
    include: {
      reporter: {
        select: { id: true, username: true, name: true },
      },
      post: {
        select: {
          id: true,
          type: true,
          deletedAt: true,
          author: {
            select: { id: true, username: true, name: true },
          },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          deletedAt: true,
          postId: true,
          author: {
            select: { id: true, username: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Compte des signalements par target (pour "5 users ont signalé ce post")
  const withCounts = await Promise.all(
    reports.map(async (r) => {
      const totalReports = await prisma.postReport.count({
        where: r.postId
          ? { postId: r.postId, status: PostReportStatus.PENDING }
          : { commentId: r.commentId, status: PostReportStatus.PENDING },
      });
      return { ...r, totalReports };
    })
  );

  return NextResponse.json({ items: withCounts });
}
