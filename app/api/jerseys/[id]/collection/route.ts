import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ isInCollection: false });
    }

    const userJersey = await prisma.userJersey.findUnique({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId: id,
        },
      },
    });

    let userPhotoUrl = null;
    if (userJersey?.userPhotoUrl) {
      const { data } = await supabaseAdmin.storage
        .from("user-jersey-photos")
        .createSignedUrl(userJersey.userPhotoUrl, 60 * 60);
      userPhotoUrl = data?.signedUrl || null;
    }

    return NextResponse.json({
      isInCollection: !!userJersey,
      userJersey: userJersey
        ? {
            ...userJersey,
            userPhotoUrl: userPhotoUrl,
          }
        : null,
    });
  } catch (error) {
    console.error("GET Collection error:", error);
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
        {
          success: false,
          error: "Vous devez être connecté pour ajouter à votre collection",
        },
        { status: 401 }
      );
    }

    const jerseyId = id;
    const {
      size,
      condition,
      hasTags = false,
      personalization,
      purchasePrice,
      purchaseDate,
      notes,
      isGift,
      isFromMysteryBox,
      userPhotoUrl,
    } = await request.json();

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
        isGift: isGift || false,
        isFromMysteryBox: isFromMysteryBox || false,
        userPhotoUrl: userPhotoUrl || null,
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

    const userJersey = await prisma.userJersey.findUnique({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId,
        },
      },
    });

    if (userJersey?.userPhotoUrl) {
      try {
        await supabaseAdmin.storage
          .from("user-jersey-photos")
          .remove([userJersey.userPhotoUrl]);
      } catch (err) {
        console.error("Erreur suppression photo:", err);
      }
    }

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour modifier votre collection" },
        { status: 401 }
      );
    }

    const jerseyId = id;
    const {
      size,
      condition,
      hasTags = false,
      personalization,
      purchasePrice,
      purchaseDate,
      notes,
      isGift,
      isFromMysteryBox,
      userPhotoUrl,
    } = await request.json();

    if (!size) {
      return NextResponse.json(
        { error: "La taille est obligatoire" },
        { status: 400 }
      );
    }

    if (!condition) {
      return NextResponse.json(
        { error: "L'état est obligatoire" },
        { status: 400 }
      );
    }

    const existingUserJersey = await prisma.userJersey.findUnique({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId,
        },
      },
    });

    if (!existingUserJersey) {
      return NextResponse.json(
        { error: "Ce maillot n'est pas dans votre collection" },
        { status: 404 }
      );
    }

    if (userPhotoUrl === null && existingUserJersey.userPhotoUrl) {
      try {
        await supabaseAdmin.storage
          .from("user-jersey-photos")
          .remove([existingUserJersey.userPhotoUrl]);
      } catch (err) {
        console.error("Erreur suppression ancienne photo:", err);
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      size,
      condition,
      hasTags,
      personalization: personalization || null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice.toString()) : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      notes: notes || null,
      isGift: isGift || false,
      isFromMysteryBox: isFromMysteryBox || false,
      updatedAt: new Date(),
    };

    // Seulement mettre à jour userPhotoUrl si elle est explicitement fournie dans le body
    if (userPhotoUrl !== undefined) {
      updateData.userPhotoUrl = userPhotoUrl || null;
    }

    const updatedUserJersey = await prisma.userJersey.update({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId,
        },
      },
      data: updateData,
      include: {
        jersey: {
          include: {
            club: {
              include: {
                league: true,
              },
            },
          },
        },
      },
    });

    let signedUserPhotoUrl = null;
    if (updatedUserJersey.userPhotoUrl) {
      const { data } = await supabaseAdmin.storage
        .from("user-jersey-photos")
        .createSignedUrl(updatedUserJersey.userPhotoUrl, 60 * 60);
      signedUserPhotoUrl = data?.signedUrl || null;
    }

    const formattedResponse = {
      ...updatedUserJersey,
      purchasePrice: updatedUserJersey.purchasePrice
        ? Number(updatedUserJersey.purchasePrice)
        : null,
      userPhotoUrl: signedUserPhotoUrl,
      jersey: {
        ...updatedUserJersey.jersey,
        retailPrice: updatedUserJersey.jersey.retailPrice
          ? Number(updatedUserJersey.jersey.retailPrice)
          : null,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Maillot mis à jour avec succès",
      userJersey: formattedResponse,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la collection:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
