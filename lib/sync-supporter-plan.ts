import type { UserPlan } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { checkAchievements } from "@/lib/achievements/check";
import {
  appleSupporterState,
  resolveSupporterPlan,
  stripeSupporterState,
  NO_SUBSCRIPTION,
  type SourceState,
} from "@/lib/supporter-sync";

const REVENUECAT_API = "https://api.revenuecat.com/v1/subscribers";

async function fetchAppleState(userId: string): Promise<SourceState> {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) throw new Error("REVENUECAT_SECRET_API_KEY manquante");

  const res = await fetch(`${REVENUECAT_API}/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RevenueCat a répondu ${res.status}`);
  return appleSupporterState(await res.json(), new Date());
}

async function fetchStripeState(customerId: string | null): Promise<SourceState> {
  if (!customerId) return NO_SUBSCRIPTION;
  const subs = await getStripe().subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  return stripeSupporterState(subs.data);
}

export type SupporterPlanResult = {
  userId: string;
  previous: UserPlan;
  next: UserPlan;
};

/**
 * Plan Supporter réel d'un compte, lu chez Stripe puis RevenueCat. N'écrit rien.
 * Lève une erreur si une source est injoignable : décider sur un état partiel
 * pourrait rétrograder un abonné payant. Retourne null si le compte n'existe pas.
 */
export async function computeSupporterPlan(
  userId: string
): Promise<SupporterPlanResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, plan: true, stripeCustomerId: true },
  });
  if (!user) return null;

  const stripe = await fetchStripeState(user.stripeCustomerId);
  // Stripe actif suffit : inutile d'interroger RevenueCat (qui créerait un
  // client vide pour un compte web seul).
  const apple = stripe.active ? NO_SUBSCRIPTION : await fetchAppleState(user.id);

  return {
    userId: user.id,
    previous: user.plan,
    next: resolveSupporterPlan({ current: user.plan, apple, stripe }),
  };
}

/**
 * Recalcule et enregistre le plan Supporter d'un compte, puis vérifie le succès
 * Supporter s'il est PRO (idempotent, rattrape un succès manqué).
 */
export async function syncSupporterPlan(
  userId: string
): Promise<SupporterPlanResult | null> {
  const result = await computeSupporterPlan(userId);
  if (!result) return null;

  if (result.next !== result.previous) {
    await prisma.user.update({
      where: { id: result.userId },
      data: { plan: result.next },
    });
  }

  if (result.next === "PRO") {
    // Un succès en échec ne doit pas faire échouer la synchro : le plan est à
    // jour et un webhook rejoué ne ferait que recommencer.
    try {
      await checkAchievements(result.userId, "supporter.subscribed");
    } catch (error) {
      console.error("checkAchievements (supporter) failed during sync:", error);
    }
  }

  return result;
}
