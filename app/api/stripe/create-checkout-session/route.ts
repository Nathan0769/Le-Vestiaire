import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/get-current-user";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const bodySchema = z.object({
  interval: z.enum(["monthly", "yearly"]),
});

function getPriceId(interval: "monthly" | "yearly"): string | undefined {
  return interval === "monthly"
    ? process.env.STRIPE_PRICE_SUPPORTER_MONTHLY
    : process.env.STRIPE_PRICE_SUPPORTER_YEARLY;
}

export async function POST(request: Request) {
  let userId: string | undefined;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    userId = user.id;

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const priceId = getPriceId(parsed.data.interval);
    if (!priceId) {
      return NextResponse.json(
        { error: "Offre indisponible" },
        { status: 500 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true, stripeCustomerId: true },
    });

    let customerId = dbUser?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: dbUser?.email ?? user.email,
        name: dbUser?.name ?? user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/soutien?canceled=true`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe Checkout Error]", {
      userId,
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
