"use client";

import { useState, useEffect } from "react";
import type { FriendWithUser } from "@/types/friendship";

export function useFriends() {
  const [friends, setFriends] = useState<FriendWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/friends");

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des amis");
      }

      const data = await res.json();
      setFriends(data.friends || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const removeFriend = async (friendshipId: string) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  };

  return {
    friends,
    loading,
    error,
    refetch: fetchFriends,
    removeFriend,
  };
}
