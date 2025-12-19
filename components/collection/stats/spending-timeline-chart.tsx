"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";

interface SpendingTimelineChartProps {
  data: { month: string; amount: number }[];
}

export function SpendingTimelineChart({ data }: SpendingTimelineChartProps) {
  const t = useTranslations("CollectionStats.spendingTimeline");

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t("noData")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      ...item,
      monthLabel: date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      }),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
            config={{
              amount: {
                label: t("spent"),
                color: "oklch(0.70 0.25 260)",
              },
            }}
            className="w-full h-[200px] md:h-[400px]"
          >
          <BarChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="monthLabel"
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              width={40}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">
                      {payload[0].payload.monthLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payload[0].value}€ {t("spent")}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="amount"
              fill="oklch(0.70 0.25 260)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
