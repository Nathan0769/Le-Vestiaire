"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics";

interface UseFollowOptions {
  onSuccess?: (result: { status: "following" | "requested" }) => void;
  onError?: (error: string) => void;
}

interface UseFollowResult {
  loading: boolean;
  follow: (
    userId: string,
    source?: "feed" | "profile" | "search" | "network"
  ) => Promise<
    | { success: true; status: "following" | "requested" }
    | { success: false; error: string }
  >;
  unfollow: (userId: string) => Promise<{ success: boolean; error?: string }>;
  block: (userId: string) => Promise<{ success: boolean; error?: string }>;
  unblock: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Invalide toutes les queries qui dépendent du graphe follow/network.
 * Appelé après chaque action follow/unfollow/block/unblock pour garder
 * les widgets synchronisés (feed, suggestions, compteurs, listes).
 */
function invalidateFollowGraph(
  queryClient: ReturnType<typeof useQueryClient>
) {
  queryClient.invalidateQueries({ queryKey: ["feed"] });
  queryClient.invalidateQueries({ queryKey: ["recommended-users"] });
  queryClient.invalidateQueries({ queryKey: ["network-counts"] });
  queryClient.invalidateQueries({ queryKey: ["followers"] });
  queryClient.invalidateQueries({ queryKey: ["following"] });
  queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
  queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
}

export function useFollow(options?: UseFollowOptions): UseFollowResult {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const follow = async (
    userId: string,
    source: "feed" | "profile" | "search" | "network" = "profile"
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/follow/${userId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const data = (await res.json()) as { status: "following" | "requested" };
      trackEvent({
        name: "user_followed",
        params: { target_user_id: userId, source, state: data.status },
      });
      invalidateFollowGraph(queryClient);
      options?.onSuccess?.(data);
      return { success: true as const, status: data.status };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erreur inconnue";
      options?.onError?.(error);
      return { success: false as const, error };
    } finally {
      setLoading(false);
    }
  };

  const unfollow = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/follow/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      invalidateFollowGraph(queryClient);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    } finally {
      setLoading(false);
    }
  };

  const block = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/block/${userId}`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur");
      trackEvent({
        name: "user_blocked",
        params: { target_user_id: userId },
      });
      invalidateFollowGraph(queryClient);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    } finally {
      setLoading(false);
    }
  };

  const unblock = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/block/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      invalidateFollowGraph(queryClient);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    } finally {
      setLoading(false);
    }
  };

  return { loading, follow, unfollow, block, unblock };
}
