import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/get-current-user";
import { standardRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { locales } from "@/i18n/locales";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
  // Environnement APNs du token (le client iOS l'envoie selon son build).
  environment: z.enum(["sandbox", "production"]).optional(),
  // Langue de l'app sur l'appareil : détermine la langue des push.
  locale: z.enum(locales).optional(),
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

    const { token, platform, environment, locale } = parsed.data;

    // Upsert : un token donné ne peut appartenir qu'à un seul utilisateur
    await prisma.pushToken.upsert({
      where: { token },
      update: { userId: user.id, platform, environment, locale },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        token,
        platform,
        environment,
        locale,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const unregisterSchema = z.object({ token: z.string().min(1) });

/**
 * Déconnexion de l'app : l'appareil ne doit plus recevoir les push de ce compte
 * (texte visible sur l'écran verrouillé d'un téléphone prêté ou partagé).
 * Ne supprime que le token du compte connecté ; réponse identique que le token
 * existe ou non, pour ne rien révéler sur les autres comptes.
 */
export async function DELETE(request: Request) {
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

    const body = await request.json().catch(() => null);
    const parsed = unregisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await prisma.pushToken.deleteMany({
      where: { token: parsed.data.token, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unregistering push token:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
