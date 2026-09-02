import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { standardRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { NotificationType } from "@prisma/client";
import { z } from "zod";

// Le toggle global (`enabled`) et l'opt-out push par type (`disabledTypes`)
// peuvent être envoyés seuls ou ensemble. Au moins un des deux est requis.
const schema = z
  .object({
    enabled: z.boolean().optional(),
    disabledTypes: z.array(z.nativeEnum(NotificationType)).optional(),
  })
  .refine((d) => d.enabled !== undefined || d.disabledTypes !== undefined, {
    message: "Aucun champ à mettre à jour",
  });

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.data.enabled !== undefined
          ? { notificationsEnabled: parsed.data.enabled }
          : {}),
        // Dédup : on ne stocke que des types uniques.
        ...(parsed.data.disabledTypes !== undefined
          ? { disabledPushTypes: [...new Set(parsed.data.disabledTypes)] }
          : {}),
      },
      select: { notificationsEnabled: true, disabledPushTypes: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/user/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
