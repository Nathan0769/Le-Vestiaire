import { describe, it, expect } from "vitest";
import {
  resolveSupporterPlan,
  appleSupporterState,
  stripeSupporterState,
  revenueCatCandidateUserIds,
} from "@/lib/supporter-sync";

const NOW = new Date("2026-10-15T12:00:00.000Z");
const NONE = { active: false, everPaid: false };
const PAST = { active: false, everPaid: true };
const ACTIVE = { active: true, everPaid: true };

describe("resolveSupporterPlan", () => {
  it("donne PRO quand l'abonnement Apple est actif, même si Stripe est terminé", () => {
    expect(
      resolveSupporterPlan({ current: "FREE", apple: ACTIVE, stripe: PAST })
    ).toBe("PRO");
  });

  it("donne PRO quand l'abonnement Stripe est actif, même si Apple a expiré", () => {
    expect(
      resolveSupporterPlan({ current: "FREE", apple: PAST, stripe: ACTIVE })
    ).toBe("PRO");
  });

  it("repasse FREE quand plus rien n'est actif mais qu'un abonnement a existé", () => {
    expect(
      resolveSupporterPlan({ current: "PRO", apple: PAST, stripe: NONE })
    ).toBe("FREE");
  });

  it("garde un Supporter offert (aucun paiement nulle part) en PRO", () => {
    expect(
      resolveSupporterPlan({ current: "PRO", apple: NONE, stripe: NONE })
    ).toBe("PRO");
  });

  it("laisse FREE un compte qui n'a jamais payé", () => {
    expect(
      resolveSupporterPlan({ current: "FREE", apple: NONE, stripe: NONE })
    ).toBe("FREE");
  });
});

describe("appleSupporterState", () => {
  const withEntitlement = (e: Record<string, unknown>) => ({
    subscriber: { entitlements: { supporter: e } },
  });

  it("est actif quand l'entitlement expire dans le futur", () => {
    expect(
      appleSupporterState(withEntitlement({ expires_date: "2026-11-15T12:00:00Z" }), NOW)
    ).toEqual({ active: true, everPaid: true });
  });

  it("est actif sans date d'expiration (achat à vie)", () => {
    expect(
      appleSupporterState(withEntitlement({ expires_date: null }), NOW)
    ).toEqual({ active: true, everPaid: true });
  });

  it("reste actif pendant la période de grâce de facturation", () => {
    expect(
      appleSupporterState(
        withEntitlement({
          expires_date: "2026-10-10T12:00:00Z",
          grace_period_expires_date: "2026-10-20T12:00:00Z",
        }),
        NOW
      )
    ).toEqual({ active: true, everPaid: true });
  });

  it("est expiré mais avec historique quand la date est passée", () => {
    expect(
      appleSupporterState(withEntitlement({ expires_date: "2026-10-01T12:00:00Z" }), NOW)
    ).toEqual({ active: false, everPaid: true });
  });

  it("n'a aucun historique sans entitlement supporter", () => {
    expect(
      appleSupporterState({ subscriber: { entitlements: {} } }, NOW)
    ).toEqual(NONE);
  });

  it("refuse une réponse illisible plutôt que de conclure à FREE", () => {
    expect(() => appleSupporterState({ oops: true }, NOW)).toThrow();
  });
});

describe("stripeSupporterState", () => {
  it("est actif avec un abonnement active ou trialing", () => {
    expect(stripeSupporterState([{ status: "canceled" }, { status: "active" }])).toEqual(ACTIVE);
    expect(stripeSupporterState([{ status: "trialing" }])).toEqual(ACTIVE);
  });

  it("a un historique sans être actif quand tout est terminé", () => {
    expect(stripeSupporterState([{ status: "canceled" }, { status: "past_due" }])).toEqual(PAST);
  });

  it("n'a aucun historique sans abonnement (client créé au checkout abandonné)", () => {
    expect(stripeSupporterState([])).toEqual(NONE);
  });
});

describe("revenueCatCandidateUserIds", () => {
  it("rassemble app_user_id, original_app_user_id et aliases sans doublon", () => {
    expect(
      revenueCatCandidateUserIds({
        app_user_id: "user_1",
        original_app_user_id: "user_1",
        aliases: ["user_1", "$RCAnonymousID:abc"],
      })
    ).toEqual(["user_1"]);
  });

  it("retrouve le vrai compte quand l'achat est sous un ID anonyme aliasé", () => {
    expect(
      revenueCatCandidateUserIds({
        app_user_id: "$RCAnonymousID:abc",
        original_app_user_id: "$RCAnonymousID:abc",
        aliases: ["$RCAnonymousID:abc", "user_2"],
      })
    ).toEqual(["user_2"]);
  });

  it("inclut les deux côtés d'un TRANSFER", () => {
    expect(
      revenueCatCandidateUserIds({
        type: "TRANSFER",
        transferred_from: ["$RCAnonymousID:abc", "user_old"],
        transferred_to: ["user_new"],
      }).sort()
    ).toEqual(["user_new", "user_old"]);
  });

  it("ignore les champs absents ou mal typés", () => {
    expect(revenueCatCandidateUserIds({ app_user_id: 42, aliases: "x" })).toEqual([]);
  });
});
