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
            cfsAvailability: {
              select: {
                id: true,
                price: true,
                promoPrice: true,
                affiliateUrl: true,
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
        cfsAvailability: item.jersey.cfsAvailability
          ? {
              ...item.jersey.cfsAvailability,
              price: Number(item.jersey.cfsAvailability.price),
              promoPrice:
                item.jersey.cfsAvailability.promoPrice !== null
                  ? Number(item.jersey.cfsAvailability.promoPrice)
                  : null,
            }
          : null,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur GET /api/wishlist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
