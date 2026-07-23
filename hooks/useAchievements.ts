"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface UnlockedAchievement {
  id: string;
  key: string;
  category: string;
  tier: string | null;
  unlockedAt: string;
  metadata: Record<string, unknown> | null;
  isSecret?: boolean;
}

export interface InProgressAchievement {
  key: string;
  category: string;
  tier: string | null;
  currentProgress: number;
  threshold: number;
  percentage: number;
  i18nKey: string;
}

export interface AchievementsResponse {
  unlocked: UnlockedAchievement[];
  inProgress: InProgressAchievement[];
  hiddenLocked: number;
  /** Ratio 0..1 de collectionneurs par clé de succès (rareté). */
  rarity: Record<string, number>;
}

export function useAchievements() {
  return useQuery<AchievementsResponse>({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });
}

export function useMarkAchievementsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/achievements/seen", { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark seen");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["achievements-unread-count"] });
    },
  });
}
