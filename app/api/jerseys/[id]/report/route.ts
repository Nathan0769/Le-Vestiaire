import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { JerseyReportCategory } from "@prisma/client";

const bodySchema = z.object({
  category: z.nativeEnum(JerseyReportCategory),
  description: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await request.json();
    const validation = bodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id: jerseyId } = await params;

    const jersey = await prisma.jersey.findUnique({
      where: { id: jerseyId },
      select: { id: true },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot introuvable" },
        { status: 404 }
      );
    }

    const report = await prisma.jerseyReport.create({
      data: {
        jerseyId,
        userId: user.id,
        category: validation.data.category,
        description: validation.data.description || null,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error("Error creating jersey report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du signalement" },
      { status: 500 }
    );
  }
}
