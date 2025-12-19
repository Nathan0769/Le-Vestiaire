"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

interface ConditionDistributionChartProps {
  data: { condition: string; count: number; percentage: number }[];
}

const CONDITION_COLORS: Record<string, string> = {
  MINT: "oklch(0.70 0.25 150)",
  EXCELLENT: "oklch(0.70 0.25 200)",
  GOOD: "oklch(0.80 0.25 90)",
  FAIR: "oklch(0.75 0.25 40)",
  POOR: "oklch(0.75 0.25 10)",
};

export function ConditionDistributionChart({
  data,
}: ConditionDistributionChartProps) {
  const t = useTranslations("CollectionStats.conditionDistribution");
  const tCondition = useTranslations("Condition");

  const formattedData = data.map((item) => ({
    ...item,
    conditionLabel: tCondition(
      item.condition as "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR"
    ),
    fill: CONDITION_COLORS[item.condition] || "oklch(0.70 0.25 260)",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={formattedData.reduce((acc, item) => {
            acc[item.condition] = {
              label: item.conditionLabel,
              color: item.fill,
            };
            return acc;
          }, {} as Record<string, { label: string; color: string }>)}
          className="h-[200px] md:h-[300px] w-full"
        >
          <BarChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="conditionLabel"
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <YAxis
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              width={30}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">{data.conditionLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("jerseysCount", { count: data.count })} ({data.percentage}%)
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
