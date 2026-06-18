import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { JerseyReportStatus } from "@prisma/client";

export async function GET() {
  const { error } = await requirePermission({ report: ["list"] });
  if (error) return error;

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
