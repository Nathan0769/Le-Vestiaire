import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jerseyId } = await params;

  const user = await getCurrentUser();
  const identifier = await getRateLimitIdentifier(user?.id);
  const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes, veuillez réessayer plus tard" },
      { status: 429 }
    );
  }

  try {
    const jersey = await prisma.jersey.findUnique({
      where: { id: jerseyId },
      select: {
        id: true,
        season: true,
        clubId: true,
      },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot non trouvé" },
        { status: 404 }
      );
    }

    const players = await prisma.seasonPlayer.findMany({
      where: {
        clubId: jersey.clubId,
        season: jersey.season,
      },
      orderBy: [{ number: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error("Erreur lors du chargement des joueurs:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des joueurs" },
      { status: 500 }
    );
  }
}
