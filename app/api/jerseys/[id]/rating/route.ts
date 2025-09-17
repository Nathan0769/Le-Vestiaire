import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

interface RatingData {
  averageRating: number;
  totalRatings: number;
  userRating?: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jerseyId = id;

    const jersey = await prisma.jersey.findUnique({
      where: { id: jerseyId },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot non trouvé" },
        { status: 404 }
      );
    }

    const user = await getCurrentUser();

    const [ratingsData, userRating] = await Promise.all([
      prisma.rating.aggregate({
        where: { jerseyId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      user
        ? prisma.rating.findUnique({
            where: {
              userId_jerseyId: {
                userId: user.id,
                jerseyId,
              },
            },
            select: { rating: true },
          })
        : null,
    ]);

    const responseData: RatingData = {
      averageRating: ratingsData._avg.rating
        ? Number(ratingsData._avg.rating)
        : 0,
      totalRatings: ratingsData._count.rating || 0,
      userRating: userRating?.rating ? Number(userRating.rating) : undefined,
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
    const ratingNumber = typeof rating === "number" ? rating : Number(rating);

    if (
      !ratingNumber ||
      ratingNumber < 0.5 ||
      ratingNumber > 5 ||
      (ratingNumber * 2) % 1 !== 0
    ) {
      return NextResponse.json(
        { error: "Le rating doit être entre 0.5 et 5 par pas de 0.5" },
        { status: 400 }
      );
    }

    const jersey = await prisma.jersey.findUnique({
      where: { id: jerseyId },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot non trouvé" },
        { status: 404 }
      );
    }

    await prisma.rating.upsert({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId,
        },
      },
      update: {
        rating: ratingNumber,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        jerseyId,
        rating: ratingNumber,
      },
    });

    const [ratingsData] = await Promise.all([
      prisma.rating.aggregate({
        where: { jerseyId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const responseData: RatingData = {
      averageRating: ratingsData._avg.rating
        ? Number(ratingsData._avg.rating)
        : 0,
      totalRatings: ratingsData._count.rating || 0,
      userRating: ratingNumber,
    };

    return NextResponse.json({
      message: "Rating mis à jour avec succès",
      ...responseData,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rating:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

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

    const ratingsData = await prisma.rating.aggregate({
      where: { jerseyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const responseData: RatingData = {
      averageRating: ratingsData._avg.rating
        ? Number(ratingsData._avg.rating)
        : 0,
      totalRatings: ratingsData._count.rating || 0,
      userRating: undefined,
    };

    return NextResponse.json({
      message: "Rating supprimé avec succès",
      ...responseData,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du rating:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
