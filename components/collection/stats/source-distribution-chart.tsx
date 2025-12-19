"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Gift, ShoppingBag } from "lucide-react";

interface SourceDistributionChartProps {
  data: { source: string; count: number }[];
  additional: {
    withTags: number;
    withPersonalization: number;
    withCustomPhoto: number;
    tagsPercentage: number;
    personalizationPercentage: number;
    customPhotoPercentage: number;
  };
}

const SOURCE_COLORS: Record<string, string> = {
  purchased: "oklch(0.70 0.25 260)",
  gift: "oklch(0.70 0.25 330)",
  mysteryBox: "oklch(0.75 0.25 40)",
};

export function SourceDistributionChart({
  data,
  additional,
}: SourceDistributionChartProps) {
  const t = useTranslations("CollectionStats.sourceDistribution");

  const formattedData = data.map((item) => ({
    ...item,
    sourceLabel: t(item.source as "purchased" | "gift" | "mysteryBox"),
    fill: SOURCE_COLORS[item.source] || "oklch(0.70 0.25 260)",
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ChartContainer
            config={formattedData.reduce((acc, item) => {
              acc[item.source] = {
                label: item.sourceLabel,
                color: item.fill,
              };
              return acc;
            }, {} as Record<string, { label: string; color: string }>)}
            className="h-[200px] md:h-[300px] w-full"
          >
            <PieChart>
              <Pie
                data={formattedData}
                dataKey="count"
                nameKey="sourceLabel"
                label={false}
              >
                {formattedData.map((item, index) => (
                  <Cell key={`cell-${index}`} fill={item.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                      <p className="text-sm font-medium">{data.sourceLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("jerseysCount", { count: data.count })}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            {t("additionalTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">{t("withTags")}</p>
              <p className="text-xs text-muted-foreground">
                {additional.tagsPercentage}% de la collection
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {additional.withTags}
            </p>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">{t("withPersonalization")}</p>
              <p className="text-xs text-muted-foreground">
                {additional.personalizationPercentage}% de la collection
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {additional.withPersonalization}
            </p>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">{t("withCustomPhoto")}</p>
              <p className="text-xs text-muted-foreground">
                {additional.customPhotoPercentage}% de la collection
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {additional.withCustomPhoto}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
