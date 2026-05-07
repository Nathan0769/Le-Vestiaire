import { NextResponse } from "next/server";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const { clubId } = await params;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");

    if (!season) {
      return NextResponse.json(
        { error: "Le paramètre season est requis" },
        { status: 400 }
      );
    }

    const trophies = await prisma.clubTrophy.findMany({
      where: { clubId, season },
      orderBy: [{ place: "asc" }, { competition: "asc" }],
      select: {
        id: true,
        competition: true,
        country: true,
        season: true,
        place: true,
      },
    });

    return NextResponse.json({ trophies });
  } catch (err) {
    console.error("GET /api/clubs/[clubId]/trophies error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
