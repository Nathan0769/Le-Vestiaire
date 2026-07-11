"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Crown, Loader2 } from "lucide-react";
import { LeaderboardCard } from "./leaderboard-card";
import { CategorySelector } from "./category-selector";
import type {
  LeaderboardCategory,
  LeaderboardResponse,
} from "@/types/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

const VALID_CATEGORIES: LeaderboardCategory[] = [
  "collection_size",
  "collection_diversity",
  "league_diversity",
  "vintage_specialist",
];

export function LeaderboardTabs() {
  const { user } = useAuth();
  const t = useTranslations("Leaderboard.tabs");
  const tMonths = useTranslations("Leaderboard.months");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const readPeriod = useCallback((): "all_time" | "month" => {
    return searchParams.get("period") === "month" ? "month" : "all_time";
  }, [searchParams]);

  const readCategory = useCallback((): LeaderboardCategory => {
    const raw = searchParams.get("category") as LeaderboardCategory | null;
    return raw && VALID_CATEGORIES.includes(raw) ? raw : "collection_size";
  }, [searchParams]);

  const [period, setPeriod] = useState<"all_time" | "month">(readPeriod);
  const [category, setCategory] = useState<LeaderboardCategory>(readCategory);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Resynchronise l'état si l'URL change (retour arrière navigateur)
  useEffect(() => {
    setPeriod(readPeriod());
    setCategory(readCategory());
  }, [readPeriod, readCategory]);

  const updateUrl = useCallback(
    (nextPeriod: "all_time" | "month", nextCategory: LeaderboardCategory) => {
      const params = new URLSearchParams();
      if (nextPeriod !== "all_time") params.set("period", nextPeriod);
      if (nextCategory !== "collection_size")
        params.set("category", nextCategory);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const handlePeriodChange = (newPeriod: "all_time" | "month") => {
    setPeriod(newPeriod);
    updateUrl(newPeriod, category);
  };

  // Handler pour la catégorie : passe en "all_time" si on sélectionne une catégorie autre que "collection_size"
  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    const nextPeriod =
      newCategory !== "collection_size" && period === "month"
        ? "all_time"
        : period;
    setCategory(newCategory);
    if (nextPeriod !== period) setPeriod(nextPeriod);
    updateUrl(nextPeriod, newCategory);
  };

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard?period=${period}&category=${category}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Leaderboard error:", error);
    } finally {
      setLoading(false);
    }
  }, [period, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getCurrentMonthYear = () => {
    const now = new Date();
    const monthKeys = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    return `${tMonths(monthKeys[now.getMonth()])} ${now.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <CategorySelector value={category} onChange={handleCategoryChange} />

      <Tabs
        value={period}
        onValueChange={(val) => handlePeriodChange(val as "month" | "all_time")}
        className="w-full"
      >
        <TabsList
          className={`grid w-full ${
            category === "collection_size"
              ? "grid-cols-2 md:max-w-md"
              : "grid-cols-1 md:max-w-xs"
          }`}
        >
          <TabsTrigger value="all_time" className="gap-2 cursor-pointer">
            <Crown className="w-4 h-4" />
            {t("allTime")}
          </TabsTrigger>
          {category === "collection_size" && (
            <TabsTrigger value="month" className="gap-2 cursor-pointer">
              <Flame className="w-4 h-4" />
              {getCurrentMonthYear()}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all_time" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data && data.entries.length > 0 ? (
            <div className="space-y-3">
              {data.entries.map((entry) => (
                <LeaderboardCard
                  key={entry.userId}
                  entry={entry}
                  category={category}
                  isCurrentUser={user?.id === entry.userId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>{t("emptyState")}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="month" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data && data.entries.length > 0 ? (
            <div className="space-y-3">
              {data.entries.map((entry) => (
                <LeaderboardCard
                  key={entry.userId}
                  entry={entry}
                  category={category}
                  isCurrentUser={user?.id === entry.userId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>{t("emptyState")}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {data && data.currentUserRank && data.currentUserRank > 50 && (
        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-center">
            {t("yourPosition")}{" "}
            <span className="font-bold">#{data.currentUserRank}</span>
          </p>
        </div>
      )}
    </div>
  );
}
