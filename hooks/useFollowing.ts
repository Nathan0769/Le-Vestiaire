"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@/types/follow";

interface UseFollowingParams {
  username: string;
  enabled?: boolean;
}

export function useFollowing({ username, enabled = true }: UseFollowingParams) {
  return useQuery({
    queryKey: ["following", username],
    enabled,
    queryFn: async () => {
      const res = await fetch(
        `/api/users/${encodeURIComponent(username)}/following?limit=50`,
      );
      if (!res.ok) throw new Error("Erreur chargement following");
      const data = (await res.json()) as {
        items: PublicUser[];
        nextCursor: string | null;
      };
      return data;
    },
  });
}
