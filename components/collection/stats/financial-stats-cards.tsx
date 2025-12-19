"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface FinancialStatsCardsProps {
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
  };
}

export function FinancialStatsCards({ financial }: FinancialStatsCardsProps) {
  const t = useTranslations("CollectionStats.financial");

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
              {financial.totalCollectionValue.toFixed(2)}€
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
              {financial.totalSpent.toFixed(2)}€
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
              {financial.averagePrice.toFixed(2)}€
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("averagePriceDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t("totalRetailValue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {financial.totalRetailValue.toFixed(2)}€
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("totalRetailValueDescription")}
            </p>
          </CardContent>
        </Card>
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
                  {financial.mostExpensive.price.toFixed(2)}€
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
                {financial.leastExpensive.price.toFixed(2)}€
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
