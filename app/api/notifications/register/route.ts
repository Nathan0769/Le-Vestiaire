import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/get-current-user";
import { standardRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { token, platform } = parsed.data;

    // Upsert : un token donné ne peut appartenir qu'à un seul utilisateur
    await prisma.pushToken.upsert({
      where: { token },
      update: { userId: user.id, platform },
      create: { id: crypto.randomUUID(), userId: user.id, token, platform },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
