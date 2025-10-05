"use client";

import { useState, useEffect } from "react";
import type { FriendshipRequest } from "@/types/friendship";

export function useFriendRequests() {
  const [requests, setRequests] = useState<FriendshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/friends/pending");

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des demandes");
      }

      const data = await res.json();
      setRequests(data.requests || []);
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
    refetch: fetchRequests,
    acceptRequest,
    rejectRequest,
  };
}
