import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");

    const recentJerseys = await prisma.jersey.findMany({
      include: {
        club: {
          include: {
            league: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const jerseysFormatted = recentJerseys.map((jersey) => ({
      id: jersey.id,
      name: jersey.name,
      imageUrl: jersey.imageUrl,
      type: jersey.type,
      season: jersey.season,
      brand: jersey.brand,
      club: {
        id: jersey.club.id,
        name: jersey.club.name,
        shortName: jersey.club.shortName,
        league: jersey.club.league,
      },
      createdAt: jersey.createdAt,
    }));

    return NextResponse.json({
      jerseys: jerseysFormatted,
      total: jerseysFormatted.length,
    });
  } catch (error) {
    console.error("Erreur API recent jerseys:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
