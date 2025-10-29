import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/users
 * Liste tous les utilisateurs avec leurs rôles
 * Réservé aux admins
 */
export async function GET(request: Request) {
  // Vérifier que l'utilisateur est admin
  const { error, session } = await requirePermission(undefined, true);
  if (error) return error;

  // Rate limiting
  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
        _count: {
          select: {
            collection: true,
            wishlist: true,
            ratings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}
