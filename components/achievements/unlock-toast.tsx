"use client";

import { toast } from "sonner";
import { Trophy } from "lucide-react";

interface UnlockedPayload {
  key: string;
  category: string;
  tier: string | null;
}

export function fireAchievementToasts(
  newAchievements: UnlockedPayload[] | undefined,
  translations: {
    title: (key: string) => string;
    unlockedLabel: string;
  }
) {
  if (!newAchievements || newAchievements.length === 0) return;

  for (const a of newAchievements) {
    toast.success(translations.unlockedLabel, {
      description: translations.title(a.key),
      icon: <Trophy className="h-4 w-4" />,
      duration: 5000,
    });
  }
}
