import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface JerseyStatsData {
  collectionCount: number;
  wishlistCount: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jerseyId = id;

    // Vérifier que le maillot existe
    const jersey = await prisma.jersey.findUnique({
      where: { id: jerseyId },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot non trouvé" },
        { status: 404 }
      );
    }

    // Compter le nombre d'utilisateurs qui ont ce maillot en collection et en wishlist
    const [collectionCount, wishlistCount] = await Promise.all([
      prisma.userJersey.count({
        where: { jerseyId },
      }),
      prisma.wishlist.count({
        where: { jerseyId },
      }),
    ]);

    const responseData: JerseyStatsData = {
      collectionCount,
      wishlistCount,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des stats du maillot:",
      error
    );
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
