"use client";

import { useQuery } from "@tanstack/react-query";

interface UnreadResponse {
  count: number;
}

export function useAchievementsUnreadCount() {
  return useQuery<UnreadResponse>({
    queryKey: ["achievements-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/achievements/unread-count");
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
