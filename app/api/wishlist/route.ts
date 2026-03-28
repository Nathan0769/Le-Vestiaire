import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: currentUser.id },
      select: {
        id: true,
        jerseyId: true,
        priority: true,
        createdAt: true,
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
      orderBy: { createdAt: "desc" },
    });

    const formatted = wishlistItems.map((item) => ({
      ...item,
      jersey: {
        ...item.jersey,
        retailPrice: item.jersey.retailPrice
          ? Number(item.jersey.retailPrice)
          : null,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur GET /api/wishlist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
