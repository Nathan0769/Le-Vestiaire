"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Award, Lock } from "lucide-react";
import { resolveAchievementI18n } from "@/lib/achievements/render";
import { getBadgeUrl } from "@/lib/achievements/badge-url";
import {
  ACHIEVEMENT_CATEGORIES,
  CATEGORY_ICONS,
  tierWeight,
} from "./achievement-visuals";
import { MedalButton, type MedalItem } from "./medal-button";
import {
  AchievementDetailModal,
  type AchievementDetail,
} from "./achievement-detail-modal";

interface UnlockedAchievement {
  id: string;
  key: string;
  category: string;
  tier: string | null;
  unlockedAt: string;
  metadata?: Record<string, unknown> | null;
}

interface Props {
  unlocked: UnlockedAchievement[];
  rarity: Record<string, number>;
}

export function PublicAchievementsView({ unlocked, rarity }: Props) {
  const t = useTranslations();
  const [selected, setSelected] = useState<AchievementDetail | null>(null);

  const items = useMemo<MedalItem[]>(
    () =>
      unlocked.map((u) => {
        const { i18nKey, params } = resolveAchievementI18n(u.key, u.metadata);
        return {
          key: u.key,
          i18nKey,
          category: u.category,
          tier: u.tier,
          unlocked: true,
          unlockedAt: u.unlockedAt,
          params,
          imageUrl: getBadgeUrl(u.key),
        };
      }),
    [unlocked],
  );

  const byCategory = useMemo(() => {
    return ACHIEVEMENT_CATEGORIES.map((cat) => ({
      cat,
      items: items
        .filter((i) => i.category === cat)
        .sort((a, b) => tierWeight(b.tier) - tierWeight(a.tier)),
    })).filter((c) => c.items.length > 0);
  }, [items]);

  function openDetail(item: MedalItem) {
    setSelected({ ...item, rarity: rarity[item.key], imageUrl: item.imageUrl });
  }

  if (unlocked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Lock className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h3 className="text-xl font-medium text-muted-foreground">
          {t("PublicAchievements.emptyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mt-2">
          {t("PublicAchievements.emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-10">
        {byCategory.map(({ cat, items: catItems }) => {
          const Icon = CATEGORY_ICONS[cat] ?? Award;
          return (
            <section key={cat}>
              <h2 className="mb-5 flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                <Icon className="h-4 w-4" />
                {t(`achievements.categories.${cat}`)}
                <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground/70">
                  {catItems.length}
                </span>
              </h2>
              <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {catItems.map((item) => (
                  <MedalButton
                    key={item.key}
                    item={item}
                    onSelect={openDetail}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <AchievementDetailModal
        achievement={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
