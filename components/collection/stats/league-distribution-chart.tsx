"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";

interface LeagueDistributionChartProps {
  data: { league: string; country: string; count: number }[];
}

export function LeagueDistributionChart({
  data,
}: LeagueDistributionChartProps) {
  const t = useTranslations("CollectionStats.leagueDistribution");

  const topLeagues = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
            config={{
              count: {
                label: t("jerseys"),
                color: "oklch(0.70 0.25 260)",
              },
            }}
            className="h-[250px] md:h-[400px] w-full"
          >
          <BarChart data={topLeagues} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-[8px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 8 }}
            />
            <YAxis
              type="category"
              dataKey="league"
              width={80}
              className="text-[8px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 8 }}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">{data.league}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.country}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("jerseysCount", { count: data.count })}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              fill="oklch(0.70 0.25 260)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
