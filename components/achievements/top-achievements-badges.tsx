"use client";

import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { resolveAchievementI18n } from "@/lib/achievements/render";

interface TopAchievement {
  key: string;
  tier: string | null;
  unlockedAt: string;
  metadata?: Record<string, unknown> | null;
}

interface Props {
  achievements: TopAchievement[];
}

const TIER_BG: Record<string, string> = {
  BRONZE: "bg-amber-700/15 border-amber-700/50 text-amber-700",
  SILVER: "bg-slate-400/15 border-slate-400/50 text-slate-500",
  GOLD: "bg-yellow-400/15 border-yellow-400/60 text-yellow-500",
  PLATINUM: "bg-indigo-400/15 border-indigo-400/60 text-indigo-500",
};

const DEFAULT_BG = "bg-primary/10 border-primary/40 text-primary";

export function TopAchievementsBadges({ achievements }: Props) {
  const t = useTranslations();

  if (achievements.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map((a) => {
        const tierClass = a.tier ? TIER_BG[a.tier] ?? DEFAULT_BG : DEFAULT_BG;
        const { i18nKey, params } = resolveAchievementI18n(a.key, a.metadata);

        return (
          <Tooltip key={a.key}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-help transition-transform hover:scale-110",
                  tierClass,
                )}
                aria-label={t(`${i18nKey}.title`, params)}
              >
                <Trophy className="w-5 h-5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-semibold text-sm">
                {t(`${i18nKey}.title`, params)}
              </p>
              <p className="text-xs opacity-90">
                {t(`${i18nKey}.description`, params)}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
