"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { SearchUserResult } from "@/types/follow";

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
          `/api/users/search?q=${encodeURIComponent(debouncedQuery.trim())}`
        );
        if (!res.ok) throw new Error("Erreur lors de la recherche");

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

  const updateFollowState = (
    userId: string,
    newState: "none" | "following" | "requested"
  ) => {
    setResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, followState: newState } : u))
    );
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    updateFollowState,
  };
}
