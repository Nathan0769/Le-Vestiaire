import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email";
import { standardRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const token = searchParams.get("token");

    if (!userId || !token) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Rate limiting par IP pour éviter le bruteforce de tokens
    const identifier = await getRateLimitIdentifier(undefined);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    // Vérification du token HMAC
    if (!verifyUnsubscribeToken(userId, token)) {
      return NextResponse.json({ error: "Token invalide" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailMarketing: false },
    });

    // Redirection vers une page de confirmation
    return NextResponse.redirect(
      new URL("/unsubscribed", request.url),
      { status: 302 }
    );
  } catch (error) {
    console.error("Erreur unsubscribe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
