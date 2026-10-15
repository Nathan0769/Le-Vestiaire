import { describe, it, expect } from "vitest";
import { affectsSupporterPlan } from "@/lib/stripe-webhook";

describe("affectsSupporterPlan", () => {
  it("déclenche une synchro sur les événements d'abonnement", () => {
    expect(affectsSupporterPlan("checkout.session.completed")).toBe(true);
    expect(affectsSupporterPlan("customer.subscription.updated")).toBe(true);
    expect(affectsSupporterPlan("customer.subscription.deleted")).toBe(true);
  });

  it("ignore les autres événements", () => {
    expect(affectsSupporterPlan("invoice.paid")).toBe(false);
  });
});
