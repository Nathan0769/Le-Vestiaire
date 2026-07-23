"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleNewAchievements } from "@/lib/achievements/handle-response";
import { resolveAchievementI18n } from "@/lib/achievements/render";
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
import { FeaturedTrophy } from "./featured-trophy";
import type { AchievementsResponse } from "@/hooks/useAchievements";

type StatusFilter = "ALL" | "UNLOCKED" | "IN_PROGRESS";

interface NewlyUnlocked {
  key: string;
  category: string;
  tier: string | null;
}

interface Props {
  data: AchievementsResponse;
  newlyUnlocked?: NewlyUnlocked[];
}

export function AchievementsPageClient({ data, newlyUnlocked }: Props) {
  const t = useTranslations();
  const { unlocked, inProgress, hiddenLocked, rarity } = data;
  const [selected, setSelected] = useState<AchievementDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    if (!newlyUnlocked || newlyUnlocked.length === 0) return;
    handleNewAchievements({ newAchievements: newlyUnlocked }, t);
  }, [newlyUnlocked, t]);

  const items = useMemo<MedalItem[]>(() => {
    const unlockedItems: MedalItem[] = unlocked.map((u) => {
      const { i18nKey, params } = resolveAchievementI18n(u.key, u.metadata);
      return {
        key: u.key,
        i18nKey,
        category: u.category,
        tier: u.tier,
        unlocked: true,
        unlockedAt: u.unlockedAt,
        params,
      };
    });

    const inProgressItems: MedalItem[] = inProgress.map((p) => ({
      key: p.key,
      i18nKey: p.i18nKey,
      category: p.category,
      tier: p.tier,
      unlocked: false,
      currentProgress: p.currentProgress,
      threshold: p.threshold,
      percentage: p.percentage,
    }));

    return [...unlockedItems, ...inProgressItems];
  }, [unlocked, inProgress]);

  const featured = useMemo(() => pickFeatured(items), [items]);

  const byCategory = useMemo(() => {
    return ACHIEVEMENT_CATEGORIES.map((cat) => {
      const all = items.filter((i) => i.category === cat);
      const shown = all
        .filter((i) => matchesFilter(i, statusFilter))
        .sort(sortMedals);
      return {
        cat,
        items: shown,
        unlockedCount: all.filter((i) => i.unlocked).length,
        total: all.length,
      };
    }).filter((c) => c.items.length > 0);
  }, [items, statusFilter]);

  function toggleFilter(value: Exclude<StatusFilter, "ALL">) {
    setStatusFilter((s) => (s === value ? "ALL" : value));
  }

  function openDetail(item: MedalItem) {
    setSelected({
      ...item,
      rarity: item.unlocked ? rarity[item.key] : undefined,
    });
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Award className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("achievements.page.title")}</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("achievements.page.subtitle")}
      </p>

      <div className="flex flex-wrap gap-2 text-sm">
        <FilterChip
          active={statusFilter === "UNLOCKED"}
          onClick={() => toggleFilter("UNLOCKED")}
        >
          {t("achievements.page.unlocked", { count: unlocked.length })}
        </FilterChip>
        <FilterChip
          active={statusFilter === "IN_PROGRESS"}
          onClick={() => toggleFilter("IN_PROGRESS")}
        >
          {t("achievements.page.inProgress", { count: inProgress.length })}
        </FilterChip>
        {hiddenLocked > 0 && (
          <span className="inline-flex items-center rounded-full bg-muted/40 px-3 py-1.5 text-muted-foreground">
            {t("achievements.page.hidden", { count: hiddenLocked })}
          </span>
        )}
      </div>

      {featured && statusFilter !== "IN_PROGRESS" && (
        <FeaturedTrophy
          item={featured}
          rarity={rarity[featured.key]}
          onSelect={openDetail}
        />
      )}

      {byCategory.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Award className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {t(
              statusFilter === "UNLOCKED"
                ? "achievements.empty.unlocked"
                : "achievements.empty.inProgress",
            )}
          </p>
        </div>
      )}

      <div className="space-y-10">
        {byCategory.map(({ cat, items: catItems, unlockedCount, total }) => {
          const Icon = CATEGORY_ICONS[cat] ?? Award;
          return (
            <section key={cat}>
              <h2 className="mb-5 flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                <Icon className="h-4 w-4" />
                {t(`achievements.categories.${cat}`)}
                <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground/70">
                  {unlockedCount} / {total}
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
    </div>
  );
}

function matchesFilter(item: MedalItem, filter: StatusFilter): boolean {
  if (filter === "UNLOCKED") return item.unlocked;
  if (filter === "IN_PROGRESS") return !item.unlocked;
  return true;
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 font-medium transition-colors cursor-pointer",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Trie : débloqués d'abord (palier décroissant), puis en cours (progression décroissante). */
function sortMedals(a: MedalItem, b: MedalItem): number {
  if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
  if (a.unlocked) return tierWeight(b.tier) - tierWeight(a.tier);
  return (b.percentage ?? 0) - (a.percentage ?? 0);
}

/** Sélectionne le succès débloqué le plus prestigieux comme mise en avant. */
function pickFeatured(items: MedalItem[]): MedalItem | null {
  const unlocked = items.filter((i) => i.unlocked && i.tier);
  if (unlocked.length === 0) return null;
  return [...unlocked].sort((a, b) => {
    const w = tierWeight(b.tier) - tierWeight(a.tier);
    if (w !== 0) return w;
    const da = a.unlockedAt ? Date.parse(a.unlockedAt) : 0;
    const db = b.unlockedAt ? Date.parse(b.unlockedAt) : 0;
    return db - da;
  })[0];
}
