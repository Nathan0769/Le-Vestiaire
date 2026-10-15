"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ClubCoverage {
  clubId: string;
  clubName: string;
  clubLogoUrl: string;
  leagueId: string;
  ownedCount: number;
  totalCount: number;
  percentage: number;
  isFavorite: boolean;
}

/**
 * Part du catalogue d'un club possédée : club favori, ou à défaut le club le plus
 * collectionné (dans ce cas on suggère de définir un favori).
 */
export function ClubCoverageCard({ data }: { data: ClubCoverage | null }) {
  const t = useTranslations("CollectionStats.clubCoverage");
  const locale = useLocale();
  if (!data) return null;

  const percentage = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(data.percentage / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-primary" />
          {data.isFavorite ? t("titleFavorite") : t("titleTopClub")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link
          href={`/jerseys/${data.leagueId}/clubs/${data.clubId}`}
          className="space-y-3 block hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src={data.clubLogoUrl}
                alt={data.clubName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{data.clubName}</p>
              <p className="text-xs text-muted-foreground">
                {t("ownedOutOf", {
                  owned: data.ownedCount,
                  total: data.totalCount,
                })}
              </p>
            </div>
            <span className="text-lg font-bold tabular-nums">{percentage}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, data.percentage)}%` }}
            />
          </div>
        </Link>
        {!data.isFavorite && (
          <Link
            href="/settings"
            className="inline-block text-primary hover:underline text-sm font-medium"
          >
            {t("setFavoriteClub")}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
