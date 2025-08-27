// app/api/jerseys/[id]/collection/route.ts

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";

// GET - Vérifier si le maillot est dans la collection
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ isInCollection: false });
    }

    const userJersey = await prisma.userJersey.findUnique({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId: params.id,
        },
      },
    });

    return NextResponse.json({
      isInCollection: !!userJersey,
      userJersey: userJersey || null,
    });
  } catch (error) {
    console.error("GET Collection error:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// POST - Ajouter à la collection
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous devez être connecté pour ajouter à votre collection",
        },
        { status: 401 }
      );
    }

    const jerseyId = params.id;
    const {
      size,
      condition,
      hasTags = false,
      personalization,
      purchasePrice,
      purchaseDate,
      notes,
    } = await request.json();

    // Validation des champs obligatoires
    if (!size) {
      return NextResponse.json(
        {
          success: false,
          error: "La taille est obligatoire",
        },
        { status: 400 }
      );
    }

    if (!condition) {
      return NextResponse.json(
        {
          success: false,
          error: "L'état est obligatoire",
        },
        { status: 400 }
      );
    }

    // Vérifier que le maillot existe
    const jersey = await prisma.jersey.findUnique({
      where: { id: jerseyId },
    });

    if (!jersey) {
      return NextResponse.json(
        {
          success: false,
          error: "Maillot non trouvé",
        },
        { status: 404 }
      );
    }

    // Vérifier si le maillot est déjà dans la collection
    const existingUserJersey = await prisma.userJersey.findUnique({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId,
        },
      },
    });

    if (existingUserJersey) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce maillot est déjà dans votre collection",
        },
        { status: 400 }
      );
    }

    // Ajouter à la collection
    const userJersey = await prisma.userJersey.create({
      data: {
        userId: user.id,
        jerseyId,
        size,
        condition,
        hasTags,
        personalization: personalization || null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Maillot ajouté à votre collection",
      userJersey,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout à la collection:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur interne",
      },
      { status: 500 }
    );
  }
}

// DELETE - Retirer de la collection
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const jerseyId = params.id;

    // Supprimer de la collection s'il existe
    const deletedUserJersey = await prisma.userJersey.deleteMany({
      where: {
        userId: user.id,
        jerseyId,
      },
    });

    if (deletedUserJersey.count === 0) {
      return NextResponse.json(
        { error: "Ce maillot n'est pas dans votre collection" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Maillot retiré de votre collection",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la collection:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
