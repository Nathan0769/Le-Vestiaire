"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import type { CurrentAnnouncement } from "@/lib/announcements/current";

/**
 * Annonce « Quoi de neuf » à montrer à ce compte (null = aucune). Partagée par
 * `WhatsNewDialog` et les autres pop-ups de l'accueil, qui lui cèdent la place.
 */
export function useCurrentAnnouncement() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const query = useQuery({
    queryKey: ["announcement-current"],
    queryFn: async () => {
      const res = await fetch("/api/announcements/current");
      if (!res.ok) return null;
      const body = (await res.json()) as { announcement: CurrentAnnouncement | null };
      return body.announcement;
    },
    enabled: !!session?.user,
    // Une fois par visite : pas de nouvel essai au retour sur l'onglet.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  return {
    announcement: query.data ?? null,
    /** Vrai tant qu'on ne sait pas encore s'il y a une annonce. */
    isPending: sessionPending || (!!session?.user && query.isPending),
  };
}
