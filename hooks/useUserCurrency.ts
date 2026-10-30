"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_CURRENCY } from "@/lib/currency";

type UserCurrency = { currency: string | null; suggested: string };

/**
 * Devise préférée du user connecté. `suggested` = préférence, sinon devise du
 * pays de l'IP : sert à préremplir le sélecteur de devise du prix d'achat.
 */
export function useUserCurrency() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ["user-currency", userId];

  const { data, isLoading } = useQuery<UserCurrency | null>({
    queryKey,
    enabled: !sessionLoading && !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/user/currency");
      if (!res.ok) return null;
      return (await res.json()) as UserCurrency;
    },
  });

  const mutation = useMutation({
    mutationFn: async (currency: string) => {
      const res = await fetch("/api/user/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour de la devise");
      return currency;
    },
    onSuccess: (currency) => {
      queryClient.setQueryData<UserCurrency>(queryKey, { currency, suggested: currency });
      // Les stats et totaux sont renvoyés dans la devise préférée.
      queryClient.invalidateQueries();
    },
  });

  return {
    currency: data?.currency ?? null,
    suggested: data?.suggested ?? DEFAULT_CURRENCY,
    loading: sessionLoading || isLoading,
    setCurrency: mutation.mutateAsync,
    saving: mutation.isPending,
  };
}
