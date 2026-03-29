import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId") ?? undefined;

    const clubs = await prisma.club.findMany({
      where: leagueId ? { leagueId } : undefined,
      select: {
        id: true,
        name: true,
        shortName: true,
        logoUrl: true,
        primaryColor: true,
        league: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Error loading clubs:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
