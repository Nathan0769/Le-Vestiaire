const SUPPORTER_PLAN_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

/**
 * Événements Stripe après lesquels le plan Supporter doit être recalculé. Le
 * plan n'est pas déduit de l'événement lui-même : `syncSupporterPlan` relit
 * Stripe et Apple, pour qu'une fin d'abonnement Stripe ne rétrograde pas un
 * abonné Apple (spec docs/specs/2026-10-15-supporter-sync.md).
 */
export function affectsSupporterPlan(type: string): boolean {
  return SUPPORTER_PLAN_EVENTS.has(type);
}
