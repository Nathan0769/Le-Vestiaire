import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeClubStats } from "@/lib/club-stats";
import type { SimpleJersey } from "@/types/jersey";

/**
 * Stats agrégées d'un club pour l'en-tête de la fiche club (app mobile) :
 * nombre de maillots, plage de saisons, chronologie des équipementiers,
 * note moyenne et nombre de fans. Miroir du calcul de la page web.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    const [jerseys, ratingAggregate, favoriteCount] = await Promise.all([
      prisma.jersey.findMany({
        where: { clubId },
        select: { id: true, type: true, season: true, brand: true },
      }),
      prisma.rating.aggregate({
        where: { jersey: { clubId } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.user.count({ where: { favoriteClubId: clubId } }),
    ]);

    const stats = computeClubStats(
      jerseys as unknown as SimpleJersey[],
      {
        avg: ratingAggregate._avg.rating
          ? Number(ratingAggregate._avg.rating)
          : 0,
        count: ratingAggregate._count.rating,
      },
      favoriteCount
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/clubs/[clubId]/stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
