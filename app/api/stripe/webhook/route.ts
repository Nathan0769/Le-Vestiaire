import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { planActionForEvent } from "@/lib/stripe-webhook";
import { checkAchievements } from "@/lib/achievements/check";

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
    // Idempotence : ne jamais retraiter un événement déjà vu.
    const existing = await prisma.stripe_events.findUnique({
      where: { id: event.id },
    });
    if (existing) {
      return NextResponse.json({ received: true, skipped: true });
    }
    await prisma.stripe_events.create({
      data: { id: event.id, type: event.type, processed: true },
    });

    const subscriptionStatus =
      event.type === "customer.subscription.updated"
        ? (event.data.object as Stripe.Subscription).status
        : undefined;

    const action = planActionForEvent({ type: event.type, subscriptionStatus });

    if (action) {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId && session.customer) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: action.plan,
              stripeCustomerId: session.customer as string,
            },
          });
          if (action.plan === "PRO") {
            await checkAchievements(userId, "supporter.subscribed");
          }
        }
      } else {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: action.plan },
          });
          if (action.plan === "PRO") {
            await checkAchievements(user.id, "supporter.subscribed");
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Retourner 200 pour éviter les retries infinis de Stripe ; on log pour investiguer.
    console.error("[Stripe Webhook Error]", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json({ received: true, error: true });
  }
}
