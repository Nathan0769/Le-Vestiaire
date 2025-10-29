import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Définition des permissions par rôle
 */
const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  user: {
    // Aucune permission spéciale
  },
  contributor: {
    jersey: ["propose"],
    proposal: ["view"],
  },
  admin: {
    jersey: ["propose"],
    proposal: ["list", "view", "approve", "reject"],
    user: ["manageRoles"],
  },
  superadmin: {
    jersey: ["propose"],
    proposal: ["list", "view", "approve", "reject"],
    user: ["manageRoles"],
  },
};

/**
 * Vérifie si un rôle a les permissions demandées
 */
function checkUserPermissions(
  role: string,
  requiredPermissions: Record<string, string[]>
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] || {};

  for (const [resource, actions] of Object.entries(requiredPermissions)) {
    const roleActions = rolePerms[resource] || [];

    // Vérifier que toutes les actions requises sont présentes
    for (const action of actions) {
      if (!roleActions.includes(action)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * User session from Better Auth
 */
interface BetterAuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string | null;
    image?: string | null;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

/**
 * Résultat de la vérification de permission
 */
interface PermissionCheckResult {
  error: NextResponse | null;
  session: BetterAuthSession | null;
}

/**
 * Vérifie qu'un utilisateur est authentifié et a les permissions requises
 *
 * @param permissions - Objet des permissions requises (ex: { jersey: ["propose"] })
 * @param requireAdmin - Si true, vérifie que l'utilisateur a le rôle "admin"
 * @returns Objet avec error (NextResponse si erreur) et session (si succès)
 *
 * @example
 * ```typescript
 * // Dans une API route
 * export async function POST(request: Request) {
 *   const { error, session } = await requirePermission({ jersey: ["propose"] });
 *   if (error) return error;
 *
 *   // L'utilisateur est authentifié et a la permission
 *   const userId = session.user.id;
 *   // ...
 * }
 * ```
 */
export async function requirePermission(
  permissions?: Record<string, string[]>,
  requireAdmin = false
): Promise<PermissionCheckResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Vérifier l'authentification
    if (!session?.user) {
      return {
        error: NextResponse.json(
          { error: "Vous devez être connecté" },
          { status: 401 }
        ),
        session: null,
      };
    }

    // Vérifier si admin requis
    const userRole = session.user.role || "user";
    if (requireAdmin && userRole !== "admin" && userRole !== "superadmin") {
      return {
        error: NextResponse.json(
          { error: "Accès réservé aux administrateurs" },
          { status: 403 }
        ),
        session: null,
      };
    }

    // Vérifier les permissions spécifiques si fournies
    if (permissions) {
      const hasPermission = checkUserPermissions(userRole, permissions);

      if (!hasPermission) {
        return {
          error: NextResponse.json(
            { error: "Permission insuffisante" },
            { status: 403 }
          ),
          session: null,
        };
      }
    }

    return { error: null, session };
  } catch (error) {
    console.error("❌ Erreur lors de la vérification des permissions:", error);
    return {
      error: NextResponse.json(
        { error: "Erreur lors de la vérification des permissions" },
        { status: 500 }
      ),
      session: null,
    };
  }
}

/**
 * Vérifie qu'un utilisateur a un rôle spécifique
 *
 * @param allowedRoles - Liste des rôles autorisés
 * @returns Objet avec error (NextResponse si erreur) et session (si succès)
 *
 * @example
 * ```typescript
 * // Autoriser seulement les contributors et admins
 * const { error, session } = await requireRole(["contributor", "admin"]);
 * if (error) return error;
 * ```
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<PermissionCheckResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        error: NextResponse.json(
          { error: "Vous devez être connecté" },
          { status: 401 }
        ),
        session: null,
      };
    }

    const userRole = session.user.role || "user";

    if (!allowedRoles.includes(userRole)) {
      return {
        error: NextResponse.json(
          { error: `Accès réservé aux rôles: ${allowedRoles.join(", ")}` },
          { status: 403 }
        ),
        session: null,
      };
    }

    return { error: null, session };
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du rôle:", error);
    return {
      error: NextResponse.json(
        { error: "Erreur lors de la vérification du rôle" },
        { status: 500 }
      ),
      session: null,
    };
  }
}
