"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Crown, Loader2 } from "lucide-react";
import { LeaderboardCard } from "./leaderboard-card";
import { CategorySelector } from "./category-selector";
import type {
  LeaderboardCategory,
  LeaderboardResponse,
} from "@/types/leaderboard";
import { useAuth } from "@/hooks/useAuth";

export function LeaderboardTabs() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"all_time" | "month">("all_time");
  const [category, setCategory] =
    useState<LeaderboardCategory>("collection_size");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
      console.error("Erreur leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [period, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getCurrentMonthYear = () => {
    const now = new Date();
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <CategorySelector value={category} onChange={setCategory} />

      <Tabs
        value={period}
        onValueChange={(val) => setPeriod(val as "month" | "all_time")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="all_time" className="gap-2 cursor-pointer">
            <Crown className="w-4 h-4" />
            All-time
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2 cursor-pointer">
            <Flame className="w-4 h-4" />
            {getCurrentMonthYear()}
          </TabsTrigger>
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
              <p>Aucun classement disponible pour cette catégorie</p>
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
              <p>Aucun classement disponible pour cette catégorie</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {data && data.currentUserRank && data.currentUserRank > 50 && (
        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-center">
            Votre position :{" "}
            <span className="font-bold">#{data.currentUserRank}</span>
          </p>
        </div>
      )}
    </div>
  );
}
