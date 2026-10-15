import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { affectsSupporterPlan } from "@/lib/stripe-webhook";
import { syncSupporterPlan } from "@/lib/sync-supporter-plan";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("[Stripe Webhook] signature invalide:", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    // Idempotence : ne jamais retraiter un événement déjà traité avec succès.
    const existing = await prisma.stripe_events.findUnique({
      where: { id: event.id },
    });
    if (existing) {
      return NextResponse.json({ received: true, skipped: true });
    }

    if (affectsSupporterPlan(event.type)) {
      let userId: string | undefined;

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        userId = session.metadata?.userId;
        if (userId && session.customer) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: session.customer as string },
          });
        }
      } else {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
          select: { id: true },
        });
        userId = user?.id;
      }

      // Le plan est relu chez Stripe et Apple : une fin d'abonnement Stripe ne
      // rétrograde pas un abonné Apple (spec docs/specs/2026-10-15-supporter-sync.md).
      if (userId) {
        await syncSupporterPlan(userId);
      }
    }

    // Marqué traité seulement après succès, pour que Stripe puisse réessayer.
    await prisma.stripe_events
      .create({ data: { id: event.id, type: event.type, processed: true } })
      .catch((error: unknown) => {
        // Livraison concurrente du même événement : déjà enregistré, sans gravité.
        if ((error as { code?: string })?.code !== "P2002") throw error;
      });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook Error]", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : error,
    });
    // 500 : Stripe réessaie. Sans risque, la synchro relit l'état réel.
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
