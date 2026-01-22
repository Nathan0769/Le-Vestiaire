"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";

interface BrandDistributionChartProps {
  data: { brand: string; count: number; percentage: number }[];
}

// Génère des couleurs flashy uniques en distribuant sur la roue chromatique
function generateColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / count + 15; // Décalage pour éviter de commencer au rouge pur
    const lightness = 0.65 + (i % 2) * 0.1; // Alterne entre 0.65 et 0.75 pour plus de contraste
    return `oklch(${lightness} 0.28 ${hue})`;
  });
}

export function BrandDistributionChart({ data }: BrandDistributionChartProps) {
  const t = useTranslations("CollectionStats.brandDistribution");
  const colors = generateColors(data.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <ChartContainer
            config={data.reduce((acc, item, index) => {
              acc[item.brand] = {
                label: item.brand,
                color: colors[index],
              };
              return acc;
            }, {} as Record<string, { label: string; color: string }>)}
            className="h-[200px] md:h-[250px] w-full md:w-[250px] flex-shrink-0"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="brand"
                label={false}
              >
                {data.map((_item, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index]}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                      <p className="text-sm font-medium">{data.brand}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("jerseysCount", { count: data.count })} ({data.percentage}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ChartContainer>

          <div className="flex flex-wrap md:flex-col gap-2 md:gap-1.5 justify-center md:justify-start max-h-[250px] md:overflow-y-auto w-full md:w-auto">
            {data.map((item, index) => (
              <div
                key={item.brand}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="text-muted-foreground truncate max-w-[120px] md:max-w-[150px]">
                  {item.brand}
                </span>
                <span className="font-medium whitespace-nowrap">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
