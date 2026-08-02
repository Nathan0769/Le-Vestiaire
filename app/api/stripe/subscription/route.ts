import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { isSupporter } from "@/lib/subscription";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

/**
 * Détails d'adhésion du supporter connecté pour l'espace membre.
 * Gère trois cas : abonnement Stripe réel, supporter offert (plan PRO sans
 * client Stripe), et erreur Stripe (on ne casse pas la page, le statut actif
 * est déjà connu côté client via isSupporter).
 */
export async function GET() {
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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, stripeCustomerId: true, createdAt: true },
    });

    if (!dbUser || !isSupporter(dbUser)) {
      return NextResponse.json({ active: false });
    }

    // Supporter offert : plan PRO sans client Stripe (comps beta / admin).
    if (!dbUser.stripeCustomerId) {
      return NextResponse.json({
        active: true,
        source: "comp",
        since: dbUser.createdAt.toISOString(),
      });
    }

    const subs = await getStripe().subscriptions.list({
      customer: dbUser.stripeCustomerId,
      status: "all",
      limit: 10,
      expand: ["data.items.data.price"],
    });

    const sub =
      subs.data.find(
        (s) => s.status === "active" || s.status === "trialing"
      ) ?? subs.data[0];

    if (!sub) {
      return NextResponse.json({
        active: true,
        source: "comp",
        since: dbUser.createdAt.toISOString(),
      });
    }

    const item = sub.items.data[0];
    const price = item?.price;
    const periodEnd = item?.current_period_end ?? null;

    return NextResponse.json({
      active: sub.status === "active" || sub.status === "trialing",
      source: "stripe",
      status: sub.status,
      interval: price?.recurring?.interval ?? null,
      amount: price?.unit_amount ?? null,
      currency: price?.currency ?? "eur",
      currentPeriodEnd: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      since: new Date(sub.start_date * 1000).toISOString(),
    });
  } catch (error) {
    console.error("[Stripe Subscription Error]", {
      error: error instanceof Error ? error.message : error,
    });
    // Statut détaillé indisponible : la page reste affichée en mode "actif".
    return NextResponse.json({ active: true, source: "unknown" });
  }
}
