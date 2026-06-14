"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  Award,
  Users,
  Trophy,
  Tag,
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RecordsCardsProps {
  records: {
    oldestAcquisition: { jerseyName: string; clubName: string; date: string };
    newestAcquisition: { jerseyName: string; clubName: string; date: string };
    topClub: { club: string; count: number } | null;
    topLeague: { league: string; country: string; count: number } | null;
    topBrand: { brand: string; count: number } | null;
    topSeason: { season: string; count: number } | null;
    mostActiveMonth: { month: string; count: number } | null;
    longestStreak: number;
  };
  additional: {
    withTags: number;
    withPersonalization: number;
    withCustomPhoto: number;
    withSigned: number;
    withAuthCertificate: number;
    tagsPercentage: number;
    personalizationPercentage: number;
    customPhotoPercentage: number;
    signedPercentage: number;
    authCertificatePercentage: number;
  };
  financial: {
    mostExpensive: { jerseyName: string; clubName: string; price: number } | null;
    leastExpensive: { jerseyName: string; clubName: string; price: number } | null;
  };
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export function RecordsCards({ records, additional, financial }: RecordsCardsProps) {
  const t = useTranslations("CollectionStats.records");

  const customizationStats = [
    { label: t("withTags"), count: additional.withTags, percentage: additional.tagsPercentage },
    { label: t("withPersonalization"), count: additional.withPersonalization, percentage: additional.personalizationPercentage },
    { label: t("withCustomPhoto"), count: additional.withCustomPhoto, percentage: additional.customPhotoPercentage },
    { label: t("withSigned"), count: additional.withSigned, percentage: additional.signedPercentage },
    { label: t("withAuthCertificate"), count: additional.withAuthCertificate, percentage: additional.authCertificatePercentage },
  ];

  return (
    <div className="space-y-6">
      {/* Acquisitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {t("oldestAcquisition")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg space-y-1">
              <p className="font-semibold leading-tight">{records.oldestAcquisition.jerseyName}</p>
              <p className="text-sm text-muted-foreground">{records.oldestAcquisition.clubName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <Calendar className="w-3 h-3 shrink-0" />
                {format(new Date(records.oldestAcquisition.date), "PPP", { locale: fr })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              {t("newestAcquisition")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg space-y-1">
              <p className="font-semibold leading-tight">{records.newestAcquisition.jerseyName}</p>
              <p className="text-sm text-muted-foreground">{records.newestAcquisition.clubName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <Calendar className="w-3 h-3 shrink-0" />
                {format(new Date(records.newestAcquisition.date), "PPP", { locale: fr })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Préférences */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {records.topClub && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Users className="w-7 h-7 mx-auto text-primary" />
              <p className="font-bold text-base leading-tight line-clamp-2">
                {records.topClub.club}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t("topClub")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("jerseyCount", { count: records.topClub.count })}
              </p>
            </CardContent>
          </Card>
        )}

        {records.topLeague && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Trophy className="w-7 h-7 mx-auto text-primary" />
              <p className="font-bold text-base leading-tight line-clamp-2">
                {records.topLeague.league}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t("topLeague")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("jerseyCount", { count: records.topLeague.count })}
              </p>
            </CardContent>
          </Card>
        )}

        {records.topBrand && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Tag className="w-7 h-7 mx-auto text-primary" />
              <p className="font-bold text-base leading-tight line-clamp-2">
                {records.topBrand.brand}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t("topBrand")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("jerseyCount", { count: records.topBrand.count })}
              </p>
            </CardContent>
          </Card>
        )}

        {records.topSeason && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <ShieldCheck className="w-7 h-7 mx-auto text-primary" />
              <p className="font-bold text-base leading-tight">
                {records.topSeason.season}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t("topSeason")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("jerseyCount", { count: records.topSeason.count })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.mostActiveMonth && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Flame className="w-7 h-7 mx-auto text-primary" />
              <p className="text-3xl font-bold text-primary">
                {records.mostActiveMonth.count}
              </p>
              <p className="text-sm font-medium capitalize">
                {formatMonth(records.mostActiveMonth.month)}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t("mostActiveMonth")}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Zap className="w-7 h-7 mx-auto text-primary" />
            <p className="text-3xl font-bold text-primary">{records.longestStreak}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
              {t("longestStreak")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("streakMonths", { count: records.longestStreak })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prix */}
      {(financial.mostExpensive || financial.leastExpensive) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {financial.mostExpensive && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.70 0.25 150)" }} />
                  {t("mostExpensive")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" style={{ color: "oklch(0.70 0.25 150)" }}>
                  {financial.mostExpensive.price.toFixed(2)}€
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-tight">
                  {financial.mostExpensive.jerseyName}
                </p>
                <p className="text-xs text-muted-foreground">{financial.mostExpensive.clubName}</p>
              </CardContent>
            </Card>
          )}

          {financial.leastExpensive && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.75 0.25 40)" }} />
                  {t("leastExpensive")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" style={{ color: "oklch(0.75 0.25 40)" }}>
                  {financial.leastExpensive.price.toFixed(2)}€
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-tight">
                  {financial.leastExpensive.jerseyName}
                </p>
                <p className="text-xs text-muted-foreground">{financial.leastExpensive.clubName}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Personnalisations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {t("customizationStats")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customizationStats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span>{stat.label}</span>
                <span className="text-muted-foreground">
                  {stat.count} <span className="text-xs">({stat.percentage}%)</span>
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
