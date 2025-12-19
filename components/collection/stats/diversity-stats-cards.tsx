"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Globe, Trophy, Users } from "lucide-react";

interface DiversityStatsCardsProps {
  stats: {
    uniqueClubs: number;
    uniqueLeagues: number;
    uniqueCountries: number;
  };
}

export function DiversityStatsCards({ stats }: DiversityStatsCardsProps) {
  const t = useTranslations("CollectionStats.diversity");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {t("uniqueClubs")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{stats.uniqueClubs}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("uniqueClubsDescription")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            {t("uniqueLeagues")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{stats.uniqueLeagues}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("uniqueLeaguesDescription")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {t("uniqueCountries")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {stats.uniqueCountries}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("uniqueCountriesDescription")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
