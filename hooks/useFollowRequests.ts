"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FollowRequestItem } from "@/types/follow";

interface UseFollowRequestsOptions {
  enabled?: boolean;
}

export function useFollowRequests(options?: UseFollowRequestsOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["follow-requests"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await fetch("/api/follow-requests");
      if (!res.ok) throw new Error("Erreur chargement demandes");
      return (await res.json()) as {
        items: FollowRequestItem[];
        nextCursor: string | null;
      };
    },
  });

  const accept = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/follow-requests/${id}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur acceptation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["follow-requests-count"] });
    },
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/follow-requests/${id}/reject`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur refus");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["follow-requests-count"] });
    },
  });

  return {
    ...query,
    accept: accept.mutateAsync,
    reject: reject.mutateAsync,
    acceptPending: accept.isPending,
    rejectPending: reject.isPending,
  };
}
