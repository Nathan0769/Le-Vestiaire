"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

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
 * Aligné sur useCurrentUser : cache TanStack Query indexé par userId, pas de
 * fetch pour les visiteurs anonymes.
 */
export function useSubscription() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const { data, isLoading } = useQuery<SubscriptionInfo | null>({
    // Cle indexee par userId : le cache d'adhesion suit le compte, jamais
    // celui d'un autre utilisateur apres un switch de session.
    queryKey: ["subscription", userId],
    // Endpoint authentifie : rien a demander tant qu'aucune session.
    enabled: !sessionLoading && !!userId,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch("/api/stripe/subscription");
      if (!res.ok) return null;
      return (await res.json()) as SubscriptionInfo | null;
    },
  });

  return { subscription: data ?? null, loading: sessionLoading || isLoading };
}
