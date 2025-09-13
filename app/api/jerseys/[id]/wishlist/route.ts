import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ isInWishlist: false });
    }

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId: id,
        },
      },
    });

    return NextResponse.json({
      isInWishlist: !!wishlistItem,
    });
  } catch (error) {
    console.error("GET Wishlist error:", error);
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
          error: "Vous devez être connecté pour ajouter à votre wishlist",
        },
        { status: 401 }
      );
    }

    const jerseyId = id;

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

    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_jerseyId: {
          userId: user.id,
          jerseyId,
        },
      },
    });

    if (existingWishlist) {
      // Retirer de la wishlist
      await prisma.wishlist.delete({
        where: {
          id: existingWishlist.id,
        },
      });

      return NextResponse.json({
        success: true,
        action: "removed",
        message: "Maillot retiré de votre wishlist",
        isInWishlist: false,
      });
    } else {
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          jerseyId,
          priority: 1,
        },
      });

      return NextResponse.json({
        success: true,
        action: "added",
        message: "Maillot ajouté à votre wishlist",
        isInWishlist: true,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la wishlist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur interne",
      },
      { status: 500 }
    );
  }
}
