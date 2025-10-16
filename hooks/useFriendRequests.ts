"use client";

import { useState, useEffect } from "react";
import type { FriendshipRequest } from "@/types/friendship";

export function useFriendRequests() {
  const [requests, setRequests] = useState<FriendshipRequest[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [etag, setEtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (opts?: {
    cursor?: string | null;
    append?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (opts?.cursor) params.set("cursor", opts.cursor);

      const res = await fetch(`/api/friends/pending?${params.toString()}`, {
        headers: etag ? { "If-None-Match": etag } : undefined,
      });

      if (res.status === 304) {
        return; // Rien de nouveau
      }

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des demandes");
      }

      const data = await res.json();
      const newEtag = res.headers.get("ETag");
      if (newEtag) setEtag(newEtag);

      setPendingCount(data.pendingCount ?? 0);
      setNextCursor(data.nextCursor ?? null);

      if (opts?.append) {
        setRequests((prev) => [...prev, ...(data.requests || [])]);
      } else {
        setRequests(data.requests || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const acceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'acceptation");
      }

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}/reject`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur lors du refus");
      }

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  };

  return {
    requests,
    loading,
    error,
    nextCursor,
    pendingCount,
    refetch: fetchRequests,
    loadMore: () =>
      nextCursor
        ? fetchRequests({ cursor: nextCursor, append: true })
        : Promise.resolve(),
    acceptRequest,
    rejectRequest,
  };
}
