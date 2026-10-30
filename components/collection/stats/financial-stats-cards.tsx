"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { formatMoney } from "@/lib/format-money";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { MarketValueCard } from "./market-value-card";

interface FinancialStatsCardsProps {
  financial: {
    currency?: string;
    totalSpent: number;
    averagePrice: number;
    totalRetailValue: number;
    totalCollectionValue: number;
    estimatedMarketValue: number;
    marketValueCoverage: number;
    marketValueItems: number;
    marketValueDetail: {
      invested: number;
      estimatedOnPriced: number;
      confidence: { high: number; medium: number; low: number };
      topJerseys: {
        clubName: string;
        jerseyName: string;
        season: string;
        value: number;
        confidence: string;
      }[];
      byClub: { clubName: string; value: number }[];
      byClubOther: number;
    };
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
  };
}

export function FinancialStatsCards({ financial }: FinancialStatsCardsProps) {
  const t = useTranslations("CollectionStats.financial");
  const locale = useLocale();
  const money = (n: number) => formatMoney(n, financial.currency ?? DEFAULT_CURRENCY, locale);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              {t("totalCollectionValue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {money(financial.totalCollectionValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("totalCollectionValueDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              {t("totalSpent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {money(financial.totalSpent)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("totalSpentDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              {t("averagePrice")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {money(financial.averagePrice)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("averagePriceDescription")}
            </p>
          </CardContent>
        </Card>

        <MarketValueCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4"
                style={{ color: "oklch(0.70 0.25 150)" }}
              />
              {t("mostExpensive")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {financial.mostExpensive ? (
              <>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "oklch(0.70 0.25 150)" }}
                >
                  {money(financial.mostExpensive.price)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {financial.mostExpensive.jerseyName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {financial.mostExpensive.clubName}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            )}
          </CardContent>
        </Card>

        {financial.leastExpensive && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown
                  className="w-4 h-4"
                  style={{ color: "oklch(0.75 0.25 40)" }}
                />
                {t("leastExpensive")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className="text-2xl font-bold"
                style={{ color: "oklch(0.75 0.25 40)" }}
              >
                {money(financial.leastExpensive.price)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {financial.leastExpensive.jerseyName}
              </p>
              <p className="text-xs text-muted-foreground">
                {financial.leastExpensive.clubName}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
