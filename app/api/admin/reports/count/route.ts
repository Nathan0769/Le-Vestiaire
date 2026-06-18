import { requirePermission } from "@/lib/check-permission";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { JerseyReportStatus } from "@prisma/client";

export async function GET() {
  const { error, session } = await requirePermission({ report: ["list"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await prisma.jerseyReport.count({
      where: { status: JerseyReportStatus.PENDING },
    });

    return NextResponse.json({ count });
  } catch (err) {
    console.error("Error counting pending reports:", err);
    return NextResponse.json({ count: 0 });
  }
}
