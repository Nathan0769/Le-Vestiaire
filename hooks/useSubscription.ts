"use client";

import { useEffect, useState } from "react";

export type SubscriptionInfo = {
  active: boolean;
  source?: "stripe" | "comp" | "unknown";
  status?: string;
  interval?: "month" | "year" | null;
  amount?: number | null;
  currency?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  since?: string | null;
};

/**
 * Détails d'adhésion du supporter connecté (formule, renouvellement, source).
 * Suit le pattern fetch + useState de useCurrentUser (pas de QueryClient global).
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/stripe/subscription", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setSubscription(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { subscription, loading };
}
