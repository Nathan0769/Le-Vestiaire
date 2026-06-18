import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { JerseyReportStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { error, session } = await requirePermission({ report: ["list"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam &&
      Object.values(JerseyReportStatus).includes(
        statusParam as JerseyReportStatus
      )
        ? (statusParam as JerseyReportStatus)
        : JerseyReportStatus.PENDING;

    const reports = await prisma.jerseyReport.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        resolver: {
          select: { id: true, username: true, name: true },
        },
        jersey: {
          select: {
            id: true,
            name: true,
            season: true,
            type: true,
            variant: true,
            imageUrl: true,
            slug: true,
            club: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logoUrl: true,
                league: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("Error listing reports:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}
