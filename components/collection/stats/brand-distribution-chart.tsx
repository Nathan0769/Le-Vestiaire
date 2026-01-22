"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";

interface BrandDistributionChartProps {
  data: { brand: string; count: number; percentage: number }[];
}

const COLORS = [
  "oklch(0.70 0.25 330)",
  "oklch(0.75 0.25 40)",
  "oklch(0.80 0.25 90)",
  "oklch(0.70 0.25 150)",
  "oklch(0.70 0.25 200)",
  "oklch(0.70 0.25 260)",
  "oklch(0.70 0.25 290)",
  "oklch(0.75 0.25 10)",
];

export function BrandDistributionChart({ data }: BrandDistributionChartProps) {
  const t = useTranslations("CollectionStats.brandDistribution");

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
                color: COLORS[index % COLORS.length],
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
                    fill={COLORS[index % COLORS.length]}
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
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
