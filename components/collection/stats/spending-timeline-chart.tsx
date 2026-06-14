"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

  const formattedData = data.reduce(
    (acc, item) => {
      const prev = acc[acc.length - 1]?.cumulative ?? 0;
      const [year, month] = item.month.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      acc.push({
        ...item,
        cumulative: Math.round((prev + item.amount) * 100) / 100,
        monthLabel: date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        }),
      });
      return acc;
    },
    [] as Array<(typeof data)[0] & { cumulative: number; monthLabel: string }>
  );

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
            cumulative: {
              label: t("totalInvested"),
              color: "oklch(0.70 0.25 260)",
            },
          }}
          className="w-full h-[200px] md:h-[400px]"
        >
          <AreaChart
            data={formattedData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="oklch(0.70 0.25 260)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="oklch(0.70 0.25 260)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => `${v}€`}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg space-y-1">
                    <p className="text-sm font-medium">{d.monthLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("monthlySpent")}: <span className="font-medium text-foreground">{d.amount.toFixed(2)}€</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("totalInvested")}: <span className="font-medium text-foreground">{d.cumulative.toFixed(2)}€</span>
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="oklch(0.70 0.25 260)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
