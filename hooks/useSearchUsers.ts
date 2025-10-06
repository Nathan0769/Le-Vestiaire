"use client";

import { useState } from "react";
import type { SearchUserResult } from "@/types/friendship";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect } from "react";

export function useSearchUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 155);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/friends/search?q=${encodeURIComponent(debouncedQuery.trim())}`
        );

        if (!res.ok) {
          throw new Error("Erreur lors de la recherche");
        }

        const data = await res.json();
        setResults(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery]);

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

      setResults((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, friendshipStatus: "PENDING" } : user
        )
      );

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

      setResults((prev) => prev.filter((user) => user.id !== userId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  };

  const reset = () => {
    setQuery("");
    setResults([]);
    setError(null);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    sendFriendRequest,
    blockUser,
    reset,
  };
}
