"use client";

import { Trophy, Sparkles } from "lucide-react";
import type { AchievementUnlockPayload } from "@/types/feed";
import { useTranslations } from "next-intl";

interface Props {
  payload: AchievementUnlockPayload;
}

const TIER_GRADIENT: Record<string, string> = {
  PLATINUM: "from-cyan-400 via-blue-500 to-indigo-600",
  GOLD: "from-amber-300 via-yellow-500 to-orange-500",
  SILVER: "from-slate-200 via-slate-400 to-slate-600",
  BRONZE: "from-orange-400 via-orange-600 to-amber-800",
};

export function PostCardAchievement({ payload }: Props) {
  const t = useTranslations();
  const tPost = useTranslations("Feed.post");
  const gradient =
    TIER_GRADIENT[payload.tier ?? "PLATINUM"] ?? TIER_GRADIENT.PLATINUM;
  const tierKey = payload.tier ?? "PLATINUM";
  const tierLabel = tPost(`achievementTiers.${tierKey}` as never);

  let title = payload.key;
  let description = "";
  try {
    const parts = payload.key.split(".");
    const category = parts[0];
    const subKey = parts.slice(1).join(".");
    const titleI18n = t(`achievements.definitions.${category}.${subKey}.title`);
    const descriptionI18n = t(
      `achievements.definitions.${category}.${subKey}.description`
    );
    if (titleI18n && !titleI18n.startsWith("achievements."))
      title = titleI18n;
    if (descriptionI18n && !descriptionI18n.startsWith("achievements."))
      description = descriptionI18n;
  } catch {
    // key manquante en i18n
  }

  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} rounded-lg p-4 text-white overflow-hidden`}
    >
      <div className="absolute -top-6 -right-6 opacity-20">
        <Sparkles className="w-24 h-24" strokeWidth={1} />
      </div>
      <div className="relative flex items-start gap-3">
        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex-shrink-0">
          <Trophy className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">
            {tPost("achievementUnlocked", { tier: tierLabel })}
          </p>
          <p className="text-base font-bold mt-0.5 leading-tight">{title}</p>
          {description && (
            <p className="text-xs opacity-90 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
