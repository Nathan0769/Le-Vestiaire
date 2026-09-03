import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { exchangeAppleCode } from "@/lib/apple/revoke";

/**
 * Reçoit l'authorization code de Sign in with Apple (flux natif), l'échange
 * contre un refresh token Apple et le stocke sur le compte `apple` de l'user.
 * Ce token permet la révocation obligatoire à la suppression de compte.
 * Best-effort : n'échoue pas la connexion si l'échange rate.
 */
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

    const body = await request.json().catch(() => null);
    const code: unknown = body?.authorizationCode;
    if (typeof code !== "string" || code.length === 0) {
      return NextResponse.json({ error: "Code manquant" }, { status: 400 });
    }

    const refreshToken = await exchangeAppleCode(code);
    if (refreshToken) {
      await prisma.account.updateMany({
        where: { userId: user.id, providerId: "apple" },
        data: { refreshToken },
      });
    }

    // Toujours 200 : la connexion ne doit pas échouer si l'échange rate.
    return NextResponse.json({ linked: Boolean(refreshToken) });
  } catch (error) {
    console.error("Erreur apple-link:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
