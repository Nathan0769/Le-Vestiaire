"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MedalTrophy } from "./medal-trophy";
import { TIER_TEXT } from "./achievement-visuals";

export interface MedalItem {
  key: string;
  i18nKey: string;
  category: string;
  tier: string | null;
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress?: number;
  threshold?: number;
  percentage?: number;
  params?: Record<string, string | number>;
}

interface Props {
  item: MedalItem;
  onSelect: (item: MedalItem) => void;
}

export function MedalButton({ item, onSelect }: Props) {
  const t = useTranslations();
  const { i18nKey, category, tier, unlocked, percentage = 0, params = {} } = item;

  const subtitle = unlocked
    ? tier
      ? t(`achievements.tiers.${tier}`)
      : ""
    : percentage > 0
      ? `${percentage} %`
      : t("achievements.detail.lockedBadge");

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
    >
      <MedalTrophy
        category={category}
        tier={tier}
        unlocked={unlocked}
        percentage={percentage}
        size={76}
        className="transition-transform group-hover:scale-105"
      />
      <span
        className={cn(
          "text-[13px] font-semibold leading-tight line-clamp-2",
          !unlocked && "text-muted-foreground",
        )}
      >
        {t(`${i18nKey}.title`, params)}
      </span>
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider tabular-nums",
          unlocked && tier ? TIER_TEXT[tier] : "text-muted-foreground/70",
        )}
      >
        {subtitle}
      </span>
    </button>
  );
}
