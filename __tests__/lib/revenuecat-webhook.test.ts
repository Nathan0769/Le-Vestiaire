import { describe, it, expect } from "vitest";
import {
  planActionForRevenueCatEvent,
  unlocksSupporterAchievement,
} from "@/lib/revenuecat-webhook";

describe("planActionForRevenueCatEvent", () => {
  it("upgrades to PRO on initial purchase", () => {
    expect(planActionForRevenueCatEvent("INITIAL_PURCHASE")).toEqual({
      plan: "PRO",
    });
  });

  it("keeps PRO on renewal", () => {
    expect(planActionForRevenueCatEvent("RENEWAL")).toEqual({ plan: "PRO" });
  });

  it("keeps PRO on product change (mensuel <-> annuel)", () => {
    expect(planActionForRevenueCatEvent("PRODUCT_CHANGE")).toEqual({
      plan: "PRO",
    });
  });

  it("re-grants PRO on uncancellation", () => {
    expect(planActionForRevenueCatEvent("UNCANCELLATION")).toEqual({
      plan: "PRO",
    });
  });

  it("downgrades to FREE on expiration", () => {
    expect(planActionForRevenueCatEvent("EXPIRATION")).toEqual({
      plan: "FREE",
    });
  });

  it("does not touch the plan on cancellation (still active until expiry)", () => {
    expect(planActionForRevenueCatEvent("CANCELLATION")).toBeNull();
  });

  it("does not touch the plan on a billing issue (grace period)", () => {
    expect(planActionForRevenueCatEvent("BILLING_ISSUE")).toBeNull();
  });

  it("returns null for unhandled event types", () => {
    expect(planActionForRevenueCatEvent("TEST")).toBeNull();
    expect(planActionForRevenueCatEvent("TRANSFER")).toBeNull();
  });
});

describe("unlocksSupporterAchievement", () => {
  it("checks the Supporter achievement on any event granting PRO", () => {
    expect(unlocksSupporterAchievement({ plan: "PRO" })).toBe(true);
  });

  it("does not check it on a downgrade to FREE", () => {
    expect(unlocksSupporterAchievement({ plan: "FREE" })).toBe(false);
  });

  it("does not check it when the event has no effect on the plan", () => {
    expect(unlocksSupporterAchievement(null)).toBe(false);
  });
});
