"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  avatarUrl?: string;
  username: string;
  role?: string;
  authProvider?: {
    hasGoogle: boolean;
    hasPassword: boolean;
    isGoogleOnly: boolean;
  };
};

export function useCurrentUser(): CurrentUser | null {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const { data } = useQuery<CurrentUser | null>({
    // Cle indexee par userId : chaque compte a sa propre entree de cache,
    // impossible de servir les donnees d'un autre utilisateur apres switch.
    queryKey: ["current-user", userId],
    // Pas de fetch pour les visiteurs anonymes (catalogue browse-first) :
    // on n'appelle /api/auth/me que si une session existe.
    enabled: !sessionLoading && !!userId,
    // Rafraichit role + URL avatar presignee au retour sur l'onglet. Un seul
    // refetch partage par session (deduplique), pas par composant : cout
    // negligeable, evite l'UI de role perime et l'avatar presigne expire.
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return (await res.json()) as CurrentUser | null;
    },
  });

  return data ?? null;
}
