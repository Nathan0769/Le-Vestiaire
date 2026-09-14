"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Wallet, TrendingUp, TrendingDown, DollarSign, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "fiable",
  medium: "indicative",
  low: "faible",
};

interface FinancialStatsCardsProps {
  financial: {
    totalSpent: number;
    averagePrice: number;
    totalRetailValue: number;
    totalCollectionValue: number;
    estimatedMarketValue: number;
    marketValueCoverage: number;
    marketValueItems: number;
    marketValueBreakdown: {
      jerseyName: string;
      clubName: string;
      season: string;
      value: number;
      confidence: string;
    }[];
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

        {financial.estimatedMarketValue > 0 ? (
          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer transition hover:border-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    {t("marketValue")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {financial.estimatedMarketValue.toFixed(2)}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimation · {financial.marketValueCoverage}% des maillots ·
                    voir le détail
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Valeur estimée de ta collection</DialogTitle>
                <DialogDescription>
                  Estimation d&apos;après les prix d&apos;achat de nos
                  collectionneurs et Classic Football Shirts.{" "}
                  {financial.marketValueCoverage}% de tes maillots ont une cote (
                  {financial.marketValueItems} maillots). La cote s&apos;affine
                  avec le temps.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  {financial.estimatedMarketValue.toFixed(2)}€
                </span>
                <span className="text-sm text-muted-foreground">estimés</span>
              </div>
              <div className="max-h-80 divide-y overflow-y-auto">
                {financial.marketValueBreakdown.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.clubName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.jerseyName} · {b.season}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {CONFIDENCE_LABEL[b.confidence] ?? b.confidence}
                      </Badge>
                      <span className="font-semibold">{b.value.toFixed(2)}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-muted-foreground" />
                  {t("marketValue")}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {t("comingSoon")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("marketValueDescription")}
              </p>
            </CardContent>
          </Card>
        )}
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
