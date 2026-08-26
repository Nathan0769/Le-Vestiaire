import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isBlocked } from "@/lib/follow";

/**
 * Wishlist publique d'un utilisateur par username (app mobile).
 * Même forme de sortie que GET /api/wishlist. Auth requise, blocage -> 403.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(currentUser.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { username: raw } = await params;
    const username = raw.toLowerCase();

    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (target.id !== currentUser.id && (await isBlocked(currentUser.id, target.id))) {
      return NextResponse.json({ error: "Accès bloqué" }, { status: 403 });
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: target.id },
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
    console.error("Erreur GET /api/users/[username]/wishlist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
