"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function useUnreadNotificationsCount() {
  const user = useCurrentUser();

  return useQuery({
    queryKey: ["notifications-unread-count"],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return { count: 0 };
      return (await res.json()) as { count: number };
    },
  });
}
