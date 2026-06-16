"use client";

import { Card, CardContent } from "@/components/ui/card";
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
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-3 md:pt-6 md:p-6 text-center space-y-1 md:space-y-2">
          <Users className="w-5 h-5 md:w-7 md:h-7 mx-auto text-primary" />
          <p className="text-2xl md:text-3xl font-bold text-primary">
            {stats.uniqueClubs}
          </p>
          <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wide leading-tight">
            {t("uniqueClubs")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 md:pt-6 md:p-6 text-center space-y-1 md:space-y-2">
          <Trophy className="w-5 h-5 md:w-7 md:h-7 mx-auto text-primary" />
          <p className="text-2xl md:text-3xl font-bold text-primary">
            {stats.uniqueLeagues}
          </p>
          <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wide leading-tight">
            {t("uniqueLeagues")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 md:pt-6 md:p-6 text-center space-y-1 md:space-y-2">
          <Globe className="w-5 h-5 md:w-7 md:h-7 mx-auto text-primary" />
          <p className="text-2xl md:text-3xl font-bold text-primary">
            {stats.uniqueCountries}
          </p>
          <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wide leading-tight">
            {t("uniqueCountries")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
