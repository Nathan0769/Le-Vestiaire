"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { getBadgeUrl } from "@/lib/achievements/badge-url";

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
    const badgeUrl = getBadgeUrl(a.key);
    toast.success(translations.unlockedLabel, {
      description: translations.title(a.key),
      icon: badgeUrl ? (
        <Image
          src={badgeUrl}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="h-5 w-5 object-contain"
        />
      ) : (
        <Trophy className="h-4 w-4" />
      ),
      duration: 5000,
    });
  }
}
