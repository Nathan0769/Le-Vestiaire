import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");

    // Récupérer les maillots avec leur note moyenne et nombre de votes
    const topRatedJerseys = await prisma.jersey.findMany({
      include: {
        club: {
          include: {
            league: true,
          },
        },
        _count: {
          select: {
            ratings: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
      },
      take: limit * 3,
    });

    const jerseysWithStats = topRatedJerseys
      .map((jersey) => {
        const totalRatings = jersey.ratings.length;
        const averageRating =
          totalRatings > 0
            ? jersey.ratings.reduce((sum, r) => sum + r.rating, 0) /
              totalRatings
            : 0;

        return {
          id: jersey.id,
          name: jersey.name,
          imageUrl: jersey.imageUrl,
          type: jersey.type,
          season: jersey.season,
          brand: jersey.brand,
          club: jersey.club,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings,
        };
      })
      .filter((jersey) => jersey.totalRatings >= 1)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);

    return NextResponse.json({
      jerseys: jerseysWithStats,
      total: jerseysWithStats.length,
    });
  } catch (error) {
    console.error("Erreur API top-rated jerseys:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
