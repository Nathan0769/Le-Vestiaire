import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { standardRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ enabled: z.boolean() });

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

    await prisma.user.update({
      where: { id: user.id },
      data: { notificationsEnabled: parsed.data.enabled },
    });

    return NextResponse.json({ notificationsEnabled: parsed.data.enabled });
  } catch (error) {
    console.error("Erreur PATCH /api/user/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
