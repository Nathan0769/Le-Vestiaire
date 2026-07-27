import { describe, it, expect } from "vitest";
import { planActionForEvent } from "@/lib/stripe-webhook";

describe("planActionForEvent", () => {
  it("upgrades to SUPPORTER on checkout completion", () => {
    expect(planActionForEvent({ type: "checkout.session.completed" })).toEqual({
      plan: "PRO",
    });
  });

  it("keeps SUPPORTER while the subscription is active or trialing", () => {
    expect(
      planActionForEvent({
        type: "customer.subscription.updated",
        subscriptionStatus: "active",
      })
    ).toEqual({ plan: "PRO" });
    expect(
      planActionForEvent({
        type: "customer.subscription.updated",
        subscriptionStatus: "trialing",
      })
    ).toEqual({ plan: "PRO" });
  });

  it("downgrades to FREE when the subscription is no longer active", () => {
    expect(
      planActionForEvent({
        type: "customer.subscription.updated",
        subscriptionStatus: "past_due",
      })
    ).toEqual({ plan: "FREE" });
  });

  it("downgrades to FREE when the subscription is deleted", () => {
    expect(
      planActionForEvent({ type: "customer.subscription.deleted" })
    ).toEqual({ plan: "FREE" });
  });

  it("returns null for unhandled event types", () => {
    expect(planActionForEvent({ type: "invoice.paid" })).toBeNull();
  });
});
