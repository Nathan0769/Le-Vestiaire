import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { planActionForRevenueCatEvent } from "@/lib/revenuecat-webhook";

/**
 * Webhook RevenueCat (abonnement Supporter iOS via IAP Apple).
 * RevenueCat POST un événement ; on met à jour `User.plan` en conséquence.
 * L'app appelle `Purchases.logIn(User.id)` → `app_user_id = User.id`.
 *
 * Auth : header `Authorization` == `REVENUECAT_WEBHOOK_SECRET` (configuré à
 * l'identique dans le dashboard RevenueCat).
 *
 * Cohabitation Stripe : on ne repasse pas un user en FREE s'il a un
 * `stripeCustomerId` (un abo web pourrait être actif) — le webhook Stripe gère
 * ce cas. Edge V1 assumé (cf. spec).
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    const auth = request.headers.get("authorization");
    if (!secret || auth !== secret) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const event = body?.event;
    const type: unknown = event?.type;
    const appUserId: unknown = event?.app_user_id;

    if (typeof type !== "string" || typeof appUserId !== "string") {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const action = planActionForRevenueCatEvent(type);
    if (!action) {
      // Événement sans effet sur le plan (CANCELLATION, BILLING_ISSUE, TEST…).
      return NextResponse.json({ received: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: appUserId },
      select: { id: true, plan: true, stripeCustomerId: true },
    });

    // ID anonyme RevenueCat ou user supprimé : on ignore proprement.
    if (!user) {
      return NextResponse.json({ received: true });
    }

    // Ne pas downgrader un user susceptible d'avoir un abo Stripe web actif.
    if (action.plan === "FREE" && user.stripeCustomerId) {
      return NextResponse.json({ received: true });
    }

    if (user.plan !== action.plan) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: action.plan },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur webhook RevenueCat:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
