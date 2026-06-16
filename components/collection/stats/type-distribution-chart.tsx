"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Shirt } from "lucide-react";

interface TypeDistributionChartProps {
  data: { type: string; count: number; percentage: number }[];
}

// Génère des couleurs flashy uniques en distribuant sur la roue chromatique
function generateColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / count + 15;
    const lightness = 0.65 + (i % 2) * 0.1;
    return `oklch(${lightness} 0.28 ${hue})`;
  });
}

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const t = useTranslations("CollectionStats.typeDistribution");
  const tJerseyType = useTranslations("JerseyType");

  const colors = generateColors(data.length);

  const formattedData = data.map((item) => ({
    ...item,
    typeLabel: tJerseyType(
      item.type as
        | "HOME"
        | "AWAY"
        | "THIRD"
        | "FOURTH"
        | "GOALKEEPER"
        | "SPECIAL"
    ),
  }));

  return (
    <Card>
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <Shirt className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-8">
          <ChartContainer
            config={formattedData.reduce((acc, item, index) => {
              acc[item.type] = {
                label: item.typeLabel,
                color: colors[index],
              };
              return acc;
            }, {} as Record<string, { label: string; color: string }>)}
            className="h-[160px] md:h-[250px] w-full md:w-[250px] flex-shrink-0"
          >
            <PieChart>
              <Pie
                data={formattedData}
                dataKey="count"
                nameKey="typeLabel"
                label={false}
              >
                {formattedData.map((_item, index) => (
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
                      <p className="text-sm font-medium">{data.typeLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("jerseysCount", { count: data.count })} ({data.percentage}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ChartContainer>

          <div className="flex flex-wrap md:flex-col gap-1.5 justify-center md:justify-start w-full md:w-auto">
            {formattedData.map((item, index) => (
              <div
                key={item.type}
                className="flex items-center gap-1.5 text-xs md:text-sm"
              >
                <span
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="text-muted-foreground">
                  {item.typeLabel}
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
