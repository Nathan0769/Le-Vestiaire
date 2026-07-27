import type { UserPlan } from "@prisma/client";

export type PlanAction = { plan: UserPlan } | null;

/**
 * Logique pure de transition de plan à partir d'un événement Stripe.
 * Extraite du handler pour être testable sans DB ni signature.
 * Retourne l'action à appliquer, ou null si l'événement n'affecte pas le plan.
 */
export function planActionForEvent(event: {
  type: string;
  subscriptionStatus?: string;
}): PlanAction {
  switch (event.type) {
    case "checkout.session.completed":
      return { plan: "PRO" };

    case "customer.subscription.updated": {
      const active =
        event.subscriptionStatus === "active" ||
        event.subscriptionStatus === "trialing";
      return { plan: active ? "PRO" : "FREE" };
    }

    case "customer.subscription.deleted":
      return { plan: "FREE" };

    default:
      return null;
  }
}
