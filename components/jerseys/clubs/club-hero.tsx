"use client";

import Image from "next/image";
import { Shirt, Calendar, Award, Star, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ClubWithLeague } from "@/types/jersey";
import type { ClubStats } from "@/lib/club-stats";
import { formatSeasonRange } from "@/lib/season-format";

type Props = {
  club: ClubWithLeague;
  stats: ClubStats;
  isSuperAdmin: boolean;
  deleteMode: boolean;
  onNameClick: (e: React.MouseEvent) => void;
};

export function ClubHero({
  club,
  stats,
  isSuperAdmin,
  deleteMode,
  onNameClick,
}: Props) {
  const t = useTranslations("ClubPage.hero");
  const tTimeline = useTranslations("ClubPage.brandTimeline");

  const seasonRangeLabel = stats.seasonRange
    ? formatSeasonRange(
        stats.seasonRange.start,
        stats.seasonRange.end,
        tTimeline("seasonRangeConnector")
      )
    : "";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 sm:p-7 bg-card"
      style={{
        backgroundImage: `linear-gradient(135deg, ${club.primaryColor}38 0%, ${club.primaryColor}14 55%, transparent 100%)`,
        borderColor: `${club.primaryColor}40`,
      }}
    >
      <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 sm:gap-6">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-background border border-border p-2">
          <Image
            src={club.logoUrl}
            alt={`Logo ${club.name}`}
            fill
            className="object-contain p-1"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1
            className={`text-2xl sm:text-3xl font-bold leading-tight select-none ${
              isSuperAdmin ? "cursor-pointer" : ""
            } ${deleteMode ? "text-destructive" : ""}`}
            onClick={onNameClick}
            title={isSuperAdmin ? t("deleteModeTitle") : undefined}
          >
            {club.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {club.league.name}
            {deleteMode && (
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 align-middle">
                {t("deleteModeBadge")}
              </span>
            )}
          </p>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
            {stats.totalJerseys > 0 && (
              <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-background border border-border shadow-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted">
                  <Shirt className="w-3 h-3 text-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">
                    {stats.totalJerseys}
                  </span>{" "}
                  {t("jerseysNoun", { count: stats.totalJerseys })}
                </span>
              </div>
            )}
            {seasonRangeLabel && (
              <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-background border border-border shadow-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted">
                  <Calendar className="w-3 h-3 text-foreground" />
                </div>
                <span className="text-xs font-semibold tabular-nums">
                  {seasonRangeLabel}
                </span>
              </div>
            )}
            {stats.currentBrand && (
              <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-background border border-border shadow-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted">
                  <Award className="w-3 h-3 text-foreground" />
                </div>
                <span className="text-xs font-semibold">
                  {stats.currentBrand}
                </span>
              </div>
            )}
            {stats.totalRatings > 0 && (
              <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-background border border-border shadow-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500/10">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </div>
                <span className="text-xs">
                  <span className="font-semibold tabular-nums">
                    {stats.avgRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">/5</span>
                </span>
              </div>
            )}
            {stats.favoriteCount > 0 && (
              <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-background border border-border shadow-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-500/10">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                </div>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">
                    {stats.favoriteCount}
                  </span>{" "}
                  {t("fansNoun", { count: stats.favoriteCount })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
