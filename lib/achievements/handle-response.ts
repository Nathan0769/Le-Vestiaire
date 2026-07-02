"use client";

import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { resolveAchievementI18n } from "@/lib/achievements/render";

interface NewAchievement {
  key: string;
  category: string;
  tier: string | null;
  metadata?: Record<string, unknown> | null;
}

interface Translator {
  (key: string, values?: Record<string, string | number>): string;
}

export function handleNewAchievements(
  result: { newAchievements?: NewAchievement[] } | null | undefined,
  t: Translator,
): void {
  const newAchievements = result?.newAchievements;
  if (!newAchievements || newAchievements.length === 0) return;

  for (const a of newAchievements) {
    trackEvent({
      name: "achievement_unlocked",
      params: { key: a.key, category: a.category, tier: a.tier },
    });

    const { i18nKey, params } = resolveAchievementI18n(a.key, a.metadata);
    let title = a.key;
    try {
      title = t(`${i18nKey}.title`, params);
    } catch {
      title = a.key;
    }

    toast.success(t("achievements.toast.unlocked"), {
      description: title,
      duration: 5000,
    });
  }
}
