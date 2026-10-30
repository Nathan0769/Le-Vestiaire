import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { isSupportedCurrency, currencyForCountry, CURRENCY_ERROR_MESSAGES } from "@/lib/currency";

/**
 * Devise préférée : préremplit le prix d'achat et sert à afficher les stats.
 * `suggested` = préférence, sinon devise du pays de l'IP (préremplissage).
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { currency: true },
    });

    const currency = userData?.currency ?? null;
    return NextResponse.json({
      currency,
      suggested: currency ?? currencyForCountry(request.headers.get("x-vercel-ip-country")),
    });
  } catch (error) {
    console.error("Erreur récupération devise:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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

    const { currency } = await request.json();
    if (!isSupportedCurrency(currency)) {
      return NextResponse.json(
        { error: CURRENCY_ERROR_MESSAGES.PURCHASE_CURRENCY_INVALID, code: "PURCHASE_CURRENCY_INVALID" },
        { status: 400 }
      );
    }

    // Les prix déjà saisis gardent leur devise : seule la préférence change.
    await prisma.user.update({
      where: { id: user.id },
      data: { currency },
    });

    return NextResponse.json({ success: true, currency });
  } catch (error) {
    console.error("Erreur mise à jour devise:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
