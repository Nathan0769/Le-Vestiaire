"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function useUnreadNotificationsCount() {
  const user = useCurrentUser();

  return useQuery({
    queryKey: ["notifications-unread-count"],
    enabled: !!user?.id,
    // Poll allege (5 min) en attendant le push APNs qui rendra ce compteur
    // event-driven. A 60s, chaque user actif reveillait Neon en continu et le
    // cout scalait lineairement avec le nombre de users.
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return { count: 0 };
      return (await res.json()) as { count: number };
    },
  });
}
