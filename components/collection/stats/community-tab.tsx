"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  Trophy,
  Star,
  Calendar,
  TrendingUp,
  Percent,
  PenLine,
  Shirt,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type {
  CommunityStatsResponse,
  TopClubEntry,
  TopLeagueEntry,
  TopBrandEntry,
} from "@/types/community-stats";

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

interface TopListProps {
  title: string;
  icon: React.ElementType;
  entries: (TopClubEntry | TopLeagueEntry | TopBrandEntry)[];
  countLabel: (count: number) => string;
  withLogo?: boolean;
}

function TopList({ title, icon: Icon, entries, countLabel, withLogo = false }: TopListProps) {
  return (
    <Card className="p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry, index) => {
            const hasLogo = withLogo && "logoUrl" in entry;
            const darkLogoUrl =
              hasLogo && "logoDarkUrl" in entry ? entry.logoDarkUrl : null;
            const lightLogoUrl = hasLogo
              ? (entry as TopClubEntry).logoUrl
              : null;
            return (
              <li
                key={"id" in entry ? entry.id : entry.name}
                className="flex items-center gap-3 min-h-8"
              >
                <span className="text-xs font-bold text-muted-foreground w-5 tabular-nums">
                  #{index + 1}
                </span>
                <div className="relative w-8 h-8 shrink-0">
                  {lightLogoUrl &&
                    (darkLogoUrl ? (
                      <>
                        <Image
                          src={lightLogoUrl}
                          alt={entry.name}
                          fill
                          className="object-contain dark:hidden"
                          unoptimized
                        />
                        <Image
                          src={darkLogoUrl}
                          alt={entry.name}
                          fill
                          className="object-contain hidden dark:block"
                          unoptimized
                        />
                      </>
                    ) : (
                      <Image
                        src={lightLogoUrl}
                        alt={entry.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ))}
                </div>
                <span className="text-sm font-medium flex-1 truncate">
                  {entry.name}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {countLabel(entry.count)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function CommunityTab() {
  const t = useTranslations("CollectionStats.community");
  const locale = useLocale();

  const { data, isLoading, error } = useQuery<CommunityStatsResponse>({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const res = await fetch("/api/community-stats");
      if (!res.ok) throw new Error("Failed to fetch community stats");
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

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">{t("error")}</p>
      </div>
    );
  }

  const { global } = data;
  const pieces = global.collectionPieces;
  const pieceTiles = [
    { key: "signed", icon: PenLine, value: pieces.signed },
    { key: "matchWorn", icon: Shirt, value: pieces.matchWorn },
    { key: "playerIssue", icon: UserCheck, value: pieces.playerIssue },
    { key: "withCertificate", icon: ShieldCheck, value: pieces.withCertificate },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("globalTitle")}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 items-start">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                {t("acquisitionsThisMonth")}
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {formatNumber(global.acquisitionsThisMonth, locale)}
            </span>
          </Card>

          <Card className="p-4 items-start">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                {t("catalogCoverage")}
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {formatPercent(global.catalogCoverage, locale)}
            </span>
          </Card>

          <Card className="p-4 items-start">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                {t("topSeason")}
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {global.topSeason?.season ?? "—"}
            </span>
            {global.topSeason && (
              <span className="text-xs text-muted-foreground">
                {t("jerseysCount", { count: global.topSeason.count })}
              </span>
            )}
          </Card>

          <Card className="p-4 items-start">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                {t("averageRating")}
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {global.averageRating !== null
                ? `${global.averageRating.toFixed(2)}/5`
                : "—"}
            </span>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TopList
            title={t("topClubs")}
            icon={Trophy}
            entries={global.topClubs}
            countLabel={(count) => t("jerseysCount", { count })}
            withLogo
          />
          <TopList
            title={t("topLeagues")}
            icon={Trophy}
            entries={global.topLeagues}
            countLabel={(count) => t("jerseysCount", { count })}
            withLogo
          />
          <TopList
            title={t("topBrands")}
            icon={Trophy}
            entries={global.topBrands}
            countLabel={(count) => t("jerseysCount", { count })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {global.mostOwnedJersey && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{t("mostOwnedJersey")}</h3>
              </div>
              <Link
                href={`/jerseys/${global.mostOwnedJersey.leagueId}/clubs/${global.mostOwnedJersey.clubId}/jerseys/${global.mostOwnedJersey.id}`}
                className="flex items-center gap-4 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-20 h-20 shrink-0">
                  <Image
                    src={global.mostOwnedJersey.imageUrl}
                    alt={global.mostOwnedJersey.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {global.mostOwnedJersey.clubName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {global.mostOwnedJersey.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("copiesCount", {
                      count: global.mostOwnedJersey.ownersCount,
                    })}
                  </p>
                </div>
              </Link>
            </Card>
          )}

          {global.topRatedJersey && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{t("topRatedJersey")}</h3>
              </div>
              <Link
                href={`/jerseys/${global.topRatedJersey.leagueId}/clubs/${global.topRatedJersey.clubId}/jerseys/${global.topRatedJersey.id}`}
                className="flex items-center gap-4 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-20 h-20 shrink-0">
                  <Image
                    src={global.topRatedJersey.imageUrl}
                    alt={global.topRatedJersey.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {global.topRatedJersey.clubName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {global.topRatedJersey.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("ratingWithVotes", {
                      rating: global.topRatedJersey.averageRating.toFixed(2),
                      count: global.topRatedJersey.votesCount,
                    })}
                  </p>
                </div>
              </Link>
            </Card>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{t("piecesTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("collectorsWithPiece", { count: pieces.collectorsWithPiece })}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pieceTiles.map(({ key, icon: Icon, value }) => (
            <Card key={key} className="p-4 items-start">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {t(`pieces.${key}`)}
                </span>
              </div>
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(value, locale)}
              </span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
