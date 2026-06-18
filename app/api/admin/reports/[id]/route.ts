import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { JerseyReportStatus } from "@prisma/client";

const bodySchema = z.object({
  status: z.enum([JerseyReportStatus.RESOLVED, JerseyReportStatus.REJECTED]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission({ report: ["manage"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const validation = bodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = await params;

    const report = await prisma.jerseyReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Signalement introuvable" },
        { status: 404 }
      );
    }

    const updated = await prisma.jerseyReport.update({
      where: { id },
      data: {
        status: validation.data.status,
        resolvedAt: new Date(),
        resolvedBy: session!.user.id,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (err) {
    console.error("Error updating report:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
