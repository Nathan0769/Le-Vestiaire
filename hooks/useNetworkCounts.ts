"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Retourne les compteurs followers/following de l'user courant.
 * Remplace useFriendsCount de l'ancien modèle bilatéral.
 */
export function useNetworkCounts() {
  const user = useCurrentUser();

  return useQuery({
    queryKey: ["network-counts"],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch("/api/user/network-counts");
      if (!res.ok) return { followers: 0, following: 0 };
      return (await res.json()) as { followers: number; following: number };
    },
  });
}
