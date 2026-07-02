"use client";

import { useTranslations } from "next-intl";
import { Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementProgressBar } from "./achievement-progress-bar";

interface Props {
  variant: "unlocked" | "in-progress";
  i18nKey: string;
  tier: string | null;
  currentProgress?: number;
  threshold: number;
  unlockedAt?: string;
  isSecret?: boolean;
  metadata?: Record<string, unknown> | null;
}

const TIER_ACCENT: Record<string, string> = {
  BRONZE: "from-amber-700/20 to-amber-700/5 border-amber-700/40",
  SILVER: "from-slate-400/20 to-slate-400/5 border-slate-400/40",
  GOLD: "from-yellow-400/20 to-yellow-400/5 border-yellow-400/40",
  PLATINUM: "from-indigo-400/25 to-indigo-400/5 border-indigo-400/50",
};

const TIER_TEXT: Record<string, string> = {
  BRONZE: "text-amber-700",
  SILVER: "text-slate-500",
  GOLD: "text-yellow-500",
  PLATINUM: "text-indigo-500",
};

const LOCKED_ACCENT = "from-muted/60 to-muted/10 border-border";

export function AchievementCard({
  variant,
  i18nKey,
  tier,
  currentProgress = 0,
  threshold,
  unlockedAt,
  isSecret = false,
  metadata,
}: Props) {
  const t = useTranslations();
  const isUnlocked = variant === "unlocked";
  const accent = isUnlocked && tier ? TIER_ACCENT[tier] : LOCKED_ACCENT;
  const tierText = tier ? TIER_TEXT[tier] : "";
  const percentage = Math.min(100, Math.round((currentProgress / threshold) * 100));

  const monthMatch = i18nKey.match(/^(.+)\.(\d{4}-\d{2})$/);
  const resolvedI18nKey = monthMatch ? monthMatch[1] : i18nKey;
  const params: Record<string, string | number> = {};
  if (monthMatch) params.month = monthMatch[2];
  if (metadata && typeof metadata.rank === "number") {
    params.rank = metadata.rank as number;
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 bg-gradient-to-br p-4 space-y-3 shadow-sm transition-opacity",
        accent,
        !isUnlocked && "opacity-80"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isUnlocked ? (
            <Trophy className={cn("h-4 w-4 shrink-0", tierText)} />
          ) : (
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-sm truncate">
            {t(`${resolvedI18nKey}.title`, params)}
          </h3>
          {isUnlocked && isSecret && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-500 shrink-0">
              {t("achievements.secret")}
            </span>
          )}
        </div>
        {isUnlocked && tier && (
          <span className={cn("text-xs font-semibold uppercase shrink-0", tierText)}>
            {t(`achievements.tiers.${tier}`)}
          </span>
        )}
        {!isUnlocked && (
          <span className="text-xs font-semibold text-primary shrink-0">
            {percentage}%
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">
        {t(`${resolvedI18nKey}.description`, params)}
      </p>

      {!isUnlocked && (
        <div className="space-y-1">
          <AchievementProgressBar value={currentProgress} max={threshold} />
          <p className="text-xs text-muted-foreground text-right">
            {currentProgress} / {threshold}
          </p>
        </div>
      )}

      {isUnlocked && unlockedAt && (
        <p className="text-xs text-muted-foreground">
          {t("achievements.unlockedOn", {
            date: new Date(unlockedAt).toLocaleDateString(),
          })}
        </p>
      )}
    </div>
  );
}
