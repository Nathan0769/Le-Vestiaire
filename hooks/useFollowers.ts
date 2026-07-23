"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@/types/follow";

interface UseFollowersParams {
  username: string;
  enabled?: boolean;
}

export function useFollowers({ username, enabled = true }: UseFollowersParams) {
  return useQuery({
    queryKey: ["followers", username],
    enabled,
    queryFn: async () => {
      const res = await fetch(
        `/api/users/${encodeURIComponent(username)}/followers?limit=50`
      );
      if (!res.ok) throw new Error("Erreur chargement followers");
      const data = (await res.json()) as {
        items: PublicUser[];
        nextCursor: string | null;
      };
      return data;
    },
  });
}
