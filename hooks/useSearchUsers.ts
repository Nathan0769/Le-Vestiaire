"use client";

import { useState } from "react";
import type { SearchUserResult } from "@/types/friendship";

export function useSearchUsers() {
  const [result, setResult] = useState<SearchUserResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUser = async (username: string) => {
    if (!username.trim()) {
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/friends/search?username=${encodeURIComponent(username.trim())}`
      );

      if (!res.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const data = await res.json();
      setResult(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      const data = await res.json();

      if (result && result.id === userId) {
        setResult({
          ...result,
          friendshipStatus: "PENDING",
        });
      }

      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  };

  const blockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/friends/${userId}/block`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur lors du blocage");
      }

      setResult(null);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    result,
    loading,
    error,
    searchUser,
    sendFriendRequest,
    blockUser,
    reset,
  };
}
