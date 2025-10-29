import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

const VALID_ROLES = ["user", "contributor", "admin", "superadmin"] as const;

/**
 * POST /api/admin/users/set-role
 * Assigne un rôle à un utilisateur
 * Réservé aux admins
 */
export async function POST(request: Request) {
  // Vérifier que l'utilisateur est admin
  const { error, session } = await requirePermission(undefined, true);
  if (error) return error;

  // Rate limiting strict pour les actions admin
  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  try {
    const { userId, role } = await request.json();

    // Validation
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      );
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Le rôle doit être l'un des suivants: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Empêcher un admin de se retirer ses propres droits
    if (userId === session!.user.id && (session!.user.role === "admin" || session!.user.role === "superadmin")) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      );
    }

    // Seuls les superadmins peuvent créer d'autres superadmins
    if (role === "superadmin" && session!.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Seul un superadmin peut créer d'autres superadmins" },
        { status: 403 }
      );
    }

    // Seuls les superadmins peuvent modifier le rôle d'un autre superadmin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (targetUser.role === "superadmin" && session!.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Seul un superadmin peut modifier le rôle d'un autre superadmin" },
        { status: 403 }
      );
    }

    // Mettre à jour le rôle dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({
      success: true,
      message: `Rôle modifié avec succès`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la modification du rôle:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du rôle" },
      { status: 500 }
    );
  }
}
