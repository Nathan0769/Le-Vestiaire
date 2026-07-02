"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { FriendshipStatus } from "@/types/friendship";
import { trackEvent } from "@/lib/analytics";
import { handleNewAchievements } from "@/lib/achievements/handle-response";

interface UseFriendshipOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useFriendship(options?: UseFriendshipOptions) {
  const [loading, setLoading] = useState(false);
  const tRoot = useTranslations();

  const sendRequest = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      trackEvent({
        name: "friend_request_sent",
        params: { target_user_id: userId },
      });

      options?.onSuccess?.();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erreur inconnue";
      options?.onError?.(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (friendshipId: string, requesterId?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur");
      }

      const data = await res.json().catch(() => null);

      if (requesterId) {
        trackEvent({
          name: "friend_request_accepted",
          params: { requester_id: requesterId },
        });
      }

      handleNewAchievements(data, tRoot);

      options?.onSuccess?.();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erreur inconnue";
      options?.onError?.(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}/reject`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur");
      }

      options?.onSuccess?.();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erreur inconnue";
      options?.onError?.(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/${userId}/block`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur");
      }

      options?.onSuccess?.();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erreur inconnue";
      options?.onError?.(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur");
      }

      options?.onSuccess?.();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erreur inconnue";
      options?.onError?.(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    blockUser,
    removeFriend,
  };
}

export function getFriendshipStatusLabel(
  status: FriendshipStatus | null
): string {
  if (!status) return "Ajouter";

  switch (status) {
    case "PENDING":
      return "En attente";
    case "ACCEPTED":
      return "Amis";
    case "REJECTED":
      return "Refusée";
    case "BLOCKED":
      return "Bloqué";
    default:
      return "Inconnu";
  }
}
