import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const identifier = await getRateLimitIdentifier();
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const clubs = await prisma.club.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { shortName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        logoUrl: true,
        league: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 10,
    });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Error searching clubs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
