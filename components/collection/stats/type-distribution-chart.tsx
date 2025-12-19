"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Shirt } from "lucide-react";

interface TypeDistributionChartProps {
  data: { type: string; count: number; percentage: number }[];
}

const COLORS = [
  "oklch(0.70 0.25 330)",
  "oklch(0.75 0.25 40)",
  "oklch(0.80 0.25 90)",
  "oklch(0.70 0.25 150)",
  "oklch(0.70 0.25 200)",
  "oklch(0.70 0.25 260)",
];

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const t = useTranslations("CollectionStats.typeDistribution");
  const tJerseyType = useTranslations("JerseyType");

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer
          config={formattedData.reduce((acc, item, index) => {
            acc[item.type] = {
              label: item.typeLabel,
              color: COLORS[index % COLORS.length],
            };
            return acc;
          }, {} as Record<string, { label: string; color: string }>)}
          className="h-[200px] md:h-[300px] w-full"
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
      </CardContent>
    </Card>
  );
}
