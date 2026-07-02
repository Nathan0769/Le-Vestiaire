"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { handleNewAchievements } from "@/lib/achievements/handle-response";
import {
  Award,
  Shirt,
  Layers,
  Users,
  Trophy,
  Calendar,
  Gem,
  PenLine,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCard } from "./achievement-card";
import { AchievementProgressBar } from "./achievement-progress-bar";
import { cn } from "@/lib/utils";
import type { AchievementsResponse, InProgressAchievement } from "@/hooks/useAchievements";

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

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  COLLECTION: Shirt,
  DIVERSITY: Layers,
  SOCIAL: Users,
  LEADERBOARD: Trophy,
  LOYALTY: Calendar,
  RARITY: Gem,
  CONTRIBUTION: PenLine,
};

const CATEGORIES = [
  "COLLECTION",
  "DIVERSITY",
  "SOCIAL",
  "LEADERBOARD",
  "LOYALTY",
  "RARITY",
  "CONTRIBUTION",
] as const;

const NEARLY_UNLOCKED_COUNT = 4;

export function AchievementsPageClient({ data, newlyUnlocked }: Props) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const { unlocked, inProgress, hiddenLocked } = data;

  useEffect(() => {
    if (!newlyUnlocked || newlyUnlocked.length === 0) return;
    handleNewAchievements({ newAchievements: newlyUnlocked }, t);
  }, [newlyUnlocked, t]);

  const nearlyUnlocked = [...inProgress]
    .filter((a) => a.currentProgress > 0 && a.percentage < 100)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, NEARLY_UNLOCKED_COUNT);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Award className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("achievements.page.title")}</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("achievements.page.subtitle")}
      </p>

      {nearlyUnlocked.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            {t("achievements.page.nearlyUnlocked")} :
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nearlyUnlocked.map((a) => (
              <NearlyUnlockedCard key={a.key} achievement={a} />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterButton
          active={statusFilter === "UNLOCKED"}
          onClick={() =>
            setStatusFilter((s) => (s === "UNLOCKED" ? "ALL" : "UNLOCKED"))
          }
        >
          {t("achievements.page.unlocked", { count: unlocked.length })}
        </FilterButton>
        <FilterButton
          active={statusFilter === "IN_PROGRESS"}
          onClick={() =>
            setStatusFilter((s) => (s === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS"))
          }
        >
          {t("achievements.page.inProgress", { count: inProgress.length })}
        </FilterButton>
        {hiddenLocked > 0 && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm text-muted-foreground bg-muted/40">
            {t("achievements.page.hidden", { count: hiddenLocked })}
          </span>
        )}
      </div>

      <Tabs defaultValue="ALL" className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full gap-1 bg-muted/40 p-1.5 rounded-xl">
          <TabsTrigger
            value="ALL"
            className="gap-2 px-4 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border-primary/20 border border-transparent"
          >
            <LayoutGrid className="w-4 h-4" />
            {t("achievements.page.all")}
          </TabsTrigger>
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="gap-2 px-4 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border-primary/20 border border-transparent"
              >
                <Icon className="w-4 h-4" />
                {t(`achievements.categories.${cat}`)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="ALL" className="mt-6">
          <AchievementsGrid
            unlocked={unlocked}
            inProgress={inProgress}
            statusFilter={statusFilter}
          />
        </TabsContent>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-6">
            <AchievementsGrid
              unlocked={unlocked.filter((a) => a.category === cat)}
              inProgress={inProgress.filter((a) => a.category === cat)}
              statusFilter={statusFilter}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

const TIER_ACCENT: Record<string, string> = {
  BRONZE: "from-amber-700/20 to-amber-700/5 border-amber-700/40",
  SILVER: "from-slate-400/20 to-slate-400/5 border-slate-400/40",
  GOLD: "from-yellow-400/20 to-yellow-400/5 border-yellow-400/40",
  PLATINUM: "from-indigo-400/25 to-indigo-400/5 border-indigo-400/50",
};

function NearlyUnlockedCard({ achievement }: { achievement: InProgressAchievement }) {
  const t = useTranslations();
  const accent =
    achievement.tier && TIER_ACCENT[achievement.tier]
      ? TIER_ACCENT[achievement.tier]
      : "from-primary/15 to-primary/5 border-primary/30";

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 bg-gradient-to-br p-4 space-y-3 shadow-sm",
        accent
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm">{t(`${achievement.i18nKey}.title`)}</h3>
        <span className="text-xs font-semibold text-primary">
          {achievement.percentage}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {t(`${achievement.i18nKey}.description`)}
      </p>
      <div className="space-y-1">
        <AchievementProgressBar
          value={achievement.currentProgress}
          max={achievement.threshold}
        />
        <p className="text-xs text-muted-foreground text-right">
          {achievement.currentProgress} / {achievement.threshold}
        </p>
      </div>
    </div>
  );
}

const TIER_WEIGHT: Record<string, number> = {
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

function tierWeight(tier: string | null): number {
  return tier ? TIER_WEIGHT[tier] ?? 0 : 0;
}

function AchievementsGrid({
  unlocked,
  inProgress,
  statusFilter,
}: {
  unlocked: AchievementsResponse["unlocked"];
  inProgress: AchievementsResponse["inProgress"];
  statusFilter: StatusFilter;
}) {
  const sortedUnlocked = [...unlocked].sort(
    (a, b) => tierWeight(b.tier) - tierWeight(a.tier)
  );
  const sortedInProgress = [...inProgress].sort(
    (a, b) => b.percentage - a.percentage
  );

  const unlockedItems = sortedUnlocked.map((u) => ({
    key: u.key,
    variant: "unlocked" as const,
    tier: u.tier,
    unlockedAt: u.unlockedAt,
    i18nKey: `achievements.definitions.${u.key}`,
    threshold: (u.metadata as { progress?: number } | null)?.progress ?? 1,
    isSecret: u.isSecret ?? false,
    metadata: u.metadata,
  }));

  const inProgressItems = sortedInProgress.map((p) => ({
    key: p.key,
    variant: "in-progress" as const,
    tier: p.tier,
    i18nKey: p.i18nKey,
    currentProgress: p.currentProgress,
    threshold: p.threshold,
  }));

  const items =
    statusFilter === "UNLOCKED"
      ? unlockedItems
      : statusFilter === "IN_PROGRESS"
      ? inProgressItems
      : [...unlockedItems, ...inProgressItems];

  if (items.length === 0) {
    return <EmptyState statusFilter={statusFilter} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(({ key, ...cardProps }) => (
        <AchievementCard key={key} {...cardProps} />
      ))}
    </div>
  );
}

function EmptyState({ statusFilter }: { statusFilter: StatusFilter }) {
  const t = useTranslations();
  const messageKey =
    statusFilter === "UNLOCKED"
      ? "achievements.empty.unlocked"
      : statusFilter === "IN_PROGRESS"
      ? "achievements.empty.inProgress"
      : "achievements.empty.all";
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Award className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-sm text-muted-foreground">{t(messageKey)}</p>
    </div>
  );
}

function FilterButton({
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
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all cursor-pointer",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
