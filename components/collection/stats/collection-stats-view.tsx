"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, TrendingUp, Wallet, Award } from "lucide-react";
import { TimelineChart } from "./timeline-chart";
import { BrandDistributionChart } from "./brand-distribution-chart";
import { TypeDistributionChart } from "./type-distribution-chart";
import { LeagueDistributionChart } from "./league-distribution-chart";
import { ClubDistributionChart } from "./club-distribution-chart";
import { SizeDistributionChart } from "./size-distribution-chart";
import { ConditionDistributionChart } from "./condition-distribution-chart";
import { SourceDistributionChart } from "./source-distribution-chart";
import { VersionDistributionChart } from "./version-distribution-chart";
import { SpendingTimelineChart } from "./spending-timeline-chart";
import { FinancialStatsCards } from "./financial-stats-cards";
import { DiversityStatsCards } from "./diversity-stats-cards";
import { RecordsCards } from "./records-cards";
import { ActivityHeatmap } from "./activity-heatmap";
import { DecadeDistributionChart } from "./decade-distribution-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

interface CollectionStats {
  totalJerseys: number;
  stats: {
    timeline: { month: string; count: number }[];
    brandDistribution: { brand: string; count: number; percentage: number }[];
    typeDistribution: { type: string; count: number; percentage: number }[];
    seasonDistribution: { season: string; count: number }[];
    leagueDistribution: { league: string; country: string; count: number }[];
    clubDistribution: { club: string; count: number }[];
    financial: {
      totalSpent: number;
      averagePrice: number;
      totalRetailValue: number;
      totalCollectionValue: number;
      mostExpensive: {
        jerseyName: string;
        clubName: string;
        price: number;
      } | null;
      leastExpensive: {
        jerseyName: string;
        clubName: string;
        price: number;
      } | null;
      spendingTimeline: { month: string; amount: number }[];
    };
    sizeDistribution: { size: string; count: number }[];
    conditionDistribution: {
      condition: string;
      count: number;
      percentage: number;
    }[];
    sourceDistribution: { source: string; count: number }[];
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
    versionDistribution: { version: string; count: number; percentage: number }[];
    diversity: {
      uniqueClubs: number;
      uniqueLeagues: number;
      uniqueCountries: number;
    };
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
    activityHeatmap: { date: string; count: number }[];
  } | null;
}

export function CollectionStatsView() {
  const t = useTranslations("CollectionStats");

  const { data, isLoading, error } = useQuery<CollectionStats>({
    queryKey: ["collection-stats"],
    queryFn: async () => {
      const res = await fetch("/api/user/collection-stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-xl font-medium text-muted-foreground mb-2">
          {t("errorTitle")}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t("errorDescription")}
        </p>
      </div>
    );
  }

  if (!data?.stats || data.totalJerseys === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-xl font-medium text-muted-foreground mb-2">
          {t("emptyTitle")}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t("emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3">
          <Package className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs md:text-sm truncate">{t("tabs.overview")}</span>
        </TabsTrigger>
        <TabsTrigger value="distribution" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3">
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs md:text-sm truncate">{t("tabs.distribution")}</span>
        </TabsTrigger>
        <TabsTrigger value="financial" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3">
          <Wallet className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs md:text-sm truncate">{t("tabs.financial")}</span>
        </TabsTrigger>
        <TabsTrigger value="records" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3">
          <Award className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs md:text-sm truncate">{t("tabs.records")}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <DiversityStatsCards stats={data.stats.diversity} />
        <TimelineChart data={data.stats.timeline} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
          <BrandDistributionChart data={data.stats.brandDistribution} />
          <TypeDistributionChart data={data.stats.typeDistribution} />
        </div>
        <ActivityHeatmap data={data.stats.activityHeatmap} />
      </TabsContent>

      <TabsContent value="distribution" className="space-y-6">
        <LeagueDistributionChart data={data.stats.leagueDistribution} />
        <ClubDistributionChart data={data.stats.clubDistribution} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SizeDistributionChart data={data.stats.sizeDistribution} />
          <ConditionDistributionChart data={data.stats.conditionDistribution} />
        </div>
        <VersionDistributionChart data={data.stats.versionDistribution} />
        <DecadeDistributionChart data={data.stats.seasonDistribution} />
        <SourceDistributionChart
          data={data.stats.sourceDistribution}
          additional={data.stats.additional}
        />
      </TabsContent>

      <TabsContent value="financial" className="space-y-6">
        <FinancialStatsCards financial={data.stats.financial} />
        <div className="w-full">
          <SpendingTimelineChart data={data.stats.financial.spendingTimeline} />
        </div>
      </TabsContent>

      <TabsContent value="records" className="space-y-6">
        <RecordsCards
          records={data.stats.records}
          additional={data.stats.additional}
          financial={{
            mostExpensive: data.stats.financial.mostExpensive,
            leastExpensive: data.stats.financial.leastExpensive,
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
