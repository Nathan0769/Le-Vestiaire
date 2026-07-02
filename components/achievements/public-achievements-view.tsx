"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Shirt,
  Layers,
  Users,
  Trophy,
  Calendar,
  Gem,
  PenLine,
  LayoutGrid,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCard } from "./achievement-card";

interface UnlockedAchievement {
  id: string;
  key: string;
  category: string;
  tier: string | null;
  unlockedAt: string;
}

interface Props {
  unlocked: UnlockedAchievement[];
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

const TIER_WEIGHT: Record<string, number> = {
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

function tierWeight(tier: string | null): number {
  return tier ? TIER_WEIGHT[tier] ?? 0 : 0;
}

export function PublicAchievementsView({ unlocked }: Props) {
  const t = useTranslations();
  const [category, setCategory] = useState<string>("ALL");

  const filtered =
    category === "ALL"
      ? unlocked
      : unlocked.filter((a) => a.category === category);

  const sorted = [...filtered].sort(
    (a, b) => tierWeight(b.tier) - tierWeight(a.tier),
  );

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
    <Tabs value={category} onValueChange={setCategory} className="w-full">
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

      <TabsContent value={category} className="mt-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              {t("PublicAchievements.emptyCategory")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((a) => (
              <AchievementCard
                key={a.id}
                variant="unlocked"
                i18nKey={`achievements.definitions.${a.key}`}
                tier={a.tier}
                threshold={1}
                unlockedAt={a.unlockedAt}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
