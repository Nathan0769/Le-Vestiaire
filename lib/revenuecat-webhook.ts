import type { UserPlan } from "@prisma/client";

export type PlanAction = { plan: UserPlan } | null;

/**
 * Logique pure de transition de plan à partir d'un type d'événement RevenueCat.
 * Extraite du handler pour être testable sans DB ni secret.
 * Retourne l'action à appliquer, ou null si l'événement n'affecte pas le plan.
 *
 * Note : CANCELLATION = auto-renouvellement coupé mais l'abo reste actif jusqu'à
 * l'échéance → on ne change rien. La bascule vers FREE se fait sur EXPIRATION.
 * Le garde-fou "ne pas downgrader si abo Stripe actif" est appliqué dans la route,
 * pas ici (il dépend du contexte user).
 */
export function planActionForRevenueCatEvent(type: string): PlanAction {
  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "PRODUCT_CHANGE":
    case "UNCANCELLATION":
      return { plan: "PRO" };

    case "EXPIRATION":
      return { plan: "FREE" };

    default:
      return null;
  }
}
