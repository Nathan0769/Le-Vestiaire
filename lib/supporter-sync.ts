import type { UserPlan } from "@prisma/client";

/**
 * Logique pure de la synchronisation du plan Supporter (spec
 * docs/specs/2026-10-15-supporter-sync.md). Les appels réseau et la DB sont
 * dans `lib/sync-supporter-plan.ts`.
 */

export type SourceState = {
  /** Un abonnement est en cours sur cette source. */
  active: boolean;
  /** Un abonnement a existé un jour sur cette source (actif ou non). */
  everPaid: boolean;
};

export const NO_SUBSCRIPTION: SourceState = { active: false, everPaid: false };

const APPLE_ENTITLEMENT_ID = "supporter";
const ANONYMOUS_PREFIX = "$RCAnonymousID:";

/**
 * Plan déduit des deux sources. Un compte qui n'a jamais payé nulle part garde
 * son plan : c'est le cas des Supporters offerts (PRO sans paiement).
 */
export function resolveSupporterPlan(input: {
  current: UserPlan;
  apple: SourceState;
  stripe: SourceState;
}): UserPlan {
  const { current, apple, stripe } = input;
  if (apple.active || stripe.active) return "PRO";
  if (!apple.everPaid && !stripe.everPaid) return current;
  return "FREE";
}

function isFuture(value: unknown, now: Date): boolean {
  if (typeof value !== "string") return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time > now.getTime();
}

/**
 * État Apple à partir de la réponse `GET /v1/subscribers/{id}` de RevenueCat.
 * Une réponse sans `subscriber.entitlements` lève une erreur : conclure à FREE
 * sur une réponse illisible rétrograderait un abonné payant.
 */
export function appleSupporterState(body: unknown, now: Date): SourceState {
  const entitlements = (body as { subscriber?: { entitlements?: unknown } })
    ?.subscriber?.entitlements;
  if (!entitlements || typeof entitlements !== "object") {
    throw new Error("Réponse RevenueCat illisible (subscriber.entitlements absent)");
  }

  const entitlement = (entitlements as Record<string, unknown>)[APPLE_ENTITLEMENT_ID];
  if (!entitlement || typeof entitlement !== "object") return NO_SUBSCRIPTION;

  const { expires_date, grace_period_expires_date } = entitlement as {
    expires_date?: unknown;
    grace_period_expires_date?: unknown;
  };
  const active =
    expires_date === null ||
    isFuture(expires_date, now) ||
    isFuture(grace_period_expires_date, now);
  return { active, everPaid: true };
}

/** État Stripe à partir des abonnements du client (tous statuts confondus). */
export function stripeSupporterState(
  subscriptions: ReadonlyArray<{ status: string }>
): SourceState {
  return {
    active: subscriptions.some(
      (s) => s.status === "active" || s.status === "trialing"
    ),
    everPaid: subscriptions.length > 0,
  };
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

/**
 * IDs pouvant correspondre à un `User.id` dans un événement webhook RevenueCat.
 * Un achat fait sous un ID anonyme puis rattaché n'apparaît que dans `aliases`
 * ou dans `transferred_from` / `transferred_to`.
 */
export function revenueCatCandidateUserIds(event: Record<string, unknown>): string[] {
  const ids = [
    ...(typeof event.app_user_id === "string" ? [event.app_user_id] : []),
    ...(typeof event.original_app_user_id === "string" ? [event.original_app_user_id] : []),
    ...(Array.isArray(event.aliases) ? stringList(event.aliases) : []),
    ...(Array.isArray(event.transferred_from) ? stringList(event.transferred_from) : []),
    ...(Array.isArray(event.transferred_to) ? stringList(event.transferred_to) : []),
  ];
  return [...new Set(ids.filter((id) => id && !id.startsWith(ANONYMOUS_PREFIX)))];
}
