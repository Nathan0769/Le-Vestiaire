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

// Génère des couleurs flashy uniques en distribuant sur la roue chromatique
function generateColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / count + 15;
    const lightness = 0.65 + (i % 2) * 0.1;
    return `oklch(${lightness} 0.28 ${hue})`;
  });
}

export function SourceDistributionChart({
  data,
  additional,
}: SourceDistributionChartProps) {
  const t = useTranslations("CollectionStats.sourceDistribution");
  const colors = generateColors(data.length);

  const formattedData = data.map((item, index) => ({
    ...item,
    sourceLabel: t(item.source as "purchased" | "gift" | "mysteryBox"),
    fill: colors[index],
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
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <ChartContainer
              config={formattedData.reduce((acc, item) => {
                acc[item.source] = {
                  label: item.sourceLabel,
                  color: item.fill,
                };
                return acc;
              }, {} as Record<string, { label: string; color: string }>)}
              className="h-[200px] md:h-[200px] w-full md:w-[200px] flex-shrink-0"
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

            <div className="flex flex-wrap md:flex-col gap-2 md:gap-2 justify-center md:justify-start w-full md:w-auto">
              {formattedData.map((item) => {
                const total = formattedData.reduce((sum, d) => sum + d.count, 0);
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div
                    key={item.source}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">
                      {item.sourceLabel}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
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
