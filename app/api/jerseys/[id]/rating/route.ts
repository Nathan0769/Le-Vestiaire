import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

interface RatingData {
  averageRating: number;
  totalRatings: number;
  userRating?: number;
}

// GET - Récupérer les données de rating pour un maillot
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

    // Calculer la moyenne et le total des ratings
    const ratingsData = await prisma.rating.aggregate({
      where: { jerseyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const user = await getCurrentUser();
    let userRating: number | undefined;

    // Si utilisateur connecté, récupérer sa note
    if (user) {
      const userRatingData = await prisma.rating.findUnique({
        where: {
          userId_jerseyId: {
            userId: user.id,
            jerseyId,
          },
        },
      });
      userRating = userRatingData?.rating;
    }

    const responseData: RatingData = {
      averageRating: ratingsData._avg.rating || 0,
      totalRatings: ratingsData._count.rating || 0,
      userRating,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erreur lors de la récupération des ratings:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour un rating
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour noter" },
        { status: 401 }
      );
    }

    const jerseyId = id;
    const { rating } = await request.json();

    // Validation du rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Le rating doit être un entier entre 1 et 5" },
        { status: 400 }
      );
    }

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

    const updatedRating = await prisma.rating.upsert({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId,
        },
      },
      update: {
        rating,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        jerseyId,
        rating,
      },
    });

    return NextResponse.json({
      message: "Rating mis à jour avec succès",
      rating: updatedRating,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rating:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rating
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const jerseyId = id;

    // Supprimer le rating s'il existe
    const deletedRating = await prisma.rating.deleteMany({
      where: {
        userId: user.id,
        jerseyId,
      },
    });

    if (deletedRating.count === 0) {
      return NextResponse.json(
        { error: "Aucun rating trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Rating supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du rating:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
