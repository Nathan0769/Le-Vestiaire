"use client";

import { Package, Trophy, Shirt, Gift, TrendingUp } from "lucide-react";
import type { FriendCollectionStats } from "@/types/friend-collection";
import { useTranslations } from "next-intl";
import type { JerseyType } from "@/types/jersey";

interface FriendCollectionStatsProps {
  stats: FriendCollectionStats;
}

export function FriendCollectionStats({ stats }: FriendCollectionStatsProps) {
  const t = useTranslations("Friends");
  const tJerseyType = useTranslations("JerseyType");

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">
            {t("jerseysOwned")}
          </h3>
        </div>
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {stats.total === 1 ? t("jersey") : t("jerseys")} {t("inCollection")}
        </p>

        {stats.totalValue && stats.totalValue > 0 && (
          <div className="flex items-center gap-2 text-sm mt-3 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{stats.totalValue.toFixed(0)}€</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">
            {t("favoriteLeagues")}
          </h3>
        </div>
        <div className="space-y-2">
          {Object.entries(stats.leagueStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([league, count]) => (
              <div key={league} className="flex justify-between items-center">
                <span className="text-sm font-medium truncate">{league}</span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
          {Object.keys(stats.leagueStats).length === 0 && (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Shirt className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">{t("preferredTypes")}</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(stats.typeStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {tJerseyType(type as JerseyType)}
                </span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
          {Object.keys(stats.typeStats).length === 0 && (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Gift className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-muted-foreground">{t("origin")}</h3>
        </div>
        <div className="space-y-2">
          {stats.provenanceStats.regular > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t("purchased")}</span>
              <span className="text-sm text-muted-foreground">
                {stats.provenanceStats.regular}
              </span>
            </div>
          )}
          {stats.provenanceStats.gifts > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t("gifts")}</span>
              <span className="text-sm text-muted-foreground">
                {stats.provenanceStats.gifts}
              </span>
            </div>
          )}
          {stats.provenanceStats.mysteryBox > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t("mysteryBox")}</span>
              <span className="text-sm text-muted-foreground">
                {stats.provenanceStats.mysteryBox}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
