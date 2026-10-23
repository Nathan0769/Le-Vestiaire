import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { banUser, unbanUser } from "@/lib/admin/ban-user";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("ban"),
    userId: z.string().min(1),
    reason: z.string().trim().min(1).max(200),
  }),
  z.object({
    action: z.literal("unban"),
    userId: z.string().min(1),
  }),
]);

/**
 * POST /api/admin/users/ban
 * Bannit (photos et avatar supprimés, posts masqués, sessions coupées)
 * ou débannit un utilisateur. Réservé aux admins.
 */
export async function POST(request: Request) {
  const { error, session } = await requirePermission(undefined, true);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }
  const { userId } = parsed.data;

  if (userId === session!.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous bannir vous-même" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }
  if (target.role === "admin" || target.role === "superadmin") {
    return NextResponse.json(
      { error: "Impossible de bannir un administrateur" },
      { status: 403 }
    );
  }

  try {
    if (parsed.data.action === "unban") {
      await unbanUser(userId);
      return NextResponse.json({ success: true });
    }

    const result = await banUser(userId, parsed.data.reason);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Erreur lors du ban:", err);
    return NextResponse.json(
      { error: "Erreur lors du bannissement" },
      { status: 500 }
    );
  }
}
