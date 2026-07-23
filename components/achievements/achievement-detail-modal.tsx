"use client";

import { useLocale, useTranslations } from "next-intl";
import { Layers, CalendarCheck, Sparkles, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AchievementProgressBar } from "./achievement-progress-bar";
import { MedalTrophy } from "./medal-trophy";
import { formatRarity } from "./achievement-visuals";
import { cn } from "@/lib/utils";

export interface AchievementDetail {
  key: string;
  i18nKey: string;
  category: string;
  tier: string | null;
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress?: number;
  threshold?: number;
  percentage?: number;
  /** Ratio 0..1 de collectionneurs ayant le succès. */
  rarity?: number;
  params?: Record<string, string | number>;
}

const TIER_PILL: Record<string, string> = {
  BRONZE: "bg-amber-600 text-white",
  SILVER: "bg-slate-500 text-white",
  GOLD: "bg-yellow-500 text-white",
  PLATINUM: "bg-indigo-500 text-white",
};

interface Props {
  achievement: AchievementDetail | null;
  onOpenChange: (open: boolean) => void;
}

export function AchievementDetailModal({ achievement, onOpenChange }: Props) {
  const t = useTranslations();
  const locale = useLocale();

  const open = achievement !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        {achievement && (
          <ModalBody achievement={achievement} t={t} locale={locale} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModalBody({
  achievement,
  t,
  locale,
}: {
  achievement: AchievementDetail;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const { i18nKey, category, tier, unlocked, params = {} } = achievement;
  const title = t(`${i18nKey}.title`, params);
  const description = t(`${i18nKey}.description`, params);
  const howToKey = `${i18nKey}.howTo`;
  const hasHowTo = t.has(howToKey);

  const pillClass =
    unlocked && tier ? TIER_PILL[tier] : "bg-muted text-muted-foreground";
  const tierLabel =
    unlocked && tier
      ? `${t(`achievements.tiers.${tier}`)} · ${t("achievements.detail.unlockedBadge")}`
      : t("achievements.detail.lockedBadge");

  const percentage =
    achievement.percentage ??
    (achievement.threshold
      ? Math.min(
          100,
          Math.round(
            ((achievement.currentProgress ?? 0) / achievement.threshold) * 100,
          ),
        )
      : 0);

  const formattedDate = achievement.unlockedAt
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(achievement.unlockedAt))
    : null;

  return (
    <>
      <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-5 text-center">
        <MedalTrophy
          category={category}
          tier={tier}
          unlocked={unlocked}
          percentage={percentage}
          size={92}
        />
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            pillClass,
          )}
        >
          {tierLabel}
        </span>
        <DialogTitle className="text-xl font-semibold tracking-tight">
          {title}
        </DialogTitle>
      </div>

      <div className="px-6 pb-6">
        <DialogDescription className="text-center text-sm text-foreground/90">
          {description}
        </DialogDescription>

        <dl className="mt-5">
          <Row
            icon={<Layers className="size-[15px]" />}
            label={t("achievements.detail.category")}
          >
            {t(`achievements.categories.${category}`)}
          </Row>

          {unlocked ? (
            <>
              {formattedDate && (
                <Row
                  icon={<CalendarCheck className="size-[15px]" />}
                  label={t("achievements.detail.unlockedOn")}
                >
                  {formattedDate}
                </Row>
              )}
              {typeof achievement.rarity === "number" && (
                <Row
                  icon={<Sparkles className="size-[15px]" />}
                  label={t("achievements.detail.rarity")}
                >
                  {t("achievements.detail.rarityValue", {
                    percent: formatRarity(achievement.rarity),
                  })}
                </Row>
              )}
            </>
          ) : (
            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Target className="size-[15px]" />
                  {t("achievements.detail.progress")}
                </span>
                <span className="ml-auto font-semibold tabular-nums">
                  {percentage} %
                </span>
              </div>
              <div className="mt-2">
                <AchievementProgressBar
                  value={achievement.currentProgress ?? 0}
                  max={achievement.threshold ?? 1}
                />
                <p className="mt-1.5 text-right text-xs text-muted-foreground tabular-nums">
                  {achievement.currentProgress ?? 0} /{" "}
                  {achievement.threshold ?? 1}
                </p>
              </div>
              {hasHowTo && (
                <div className="mt-4 rounded-xl bg-primary/10 p-3.5 text-sm">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {t("achievements.detail.howToTitle")}
                  </p>
                  {t(howToKey, params)}
                </div>
              )}
            </div>
          )}
        </dl>
      </div>
    </>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-t border-border py-2.5 text-sm first:border-t-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="ml-auto font-medium tabular-nums">{children}</span>
    </div>
  );
}
