"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

interface DecadeDistributionChartProps {
  data: { season: string; count: number }[];
}

const DECADE_COLORS: Record<string, string> = {
  "1950s": "oklch(0.65 0.14 20)",
  "1960s": "oklch(0.65 0.16 35)",
  "1970s": "oklch(0.65 0.18 55)",
  "1980s": "oklch(0.65 0.20 80)",
  "1990s": "oklch(0.65 0.22 150)",
  "2000s": "oklch(0.65 0.22 220)",
  "2010s": "oklch(0.65 0.24 260)",
  "2020s": "oklch(0.65 0.24 290)",
};
const DEFAULT_COLOR = "oklch(0.65 0.20 260)";

function getDecade(season: string): string {
  const year = parseInt(season.split("-")[0]);
  if (isNaN(year)) return "?";
  return `${Math.floor(year / 10) * 10}s`;
}

export function DecadeDistributionChart({ data }: DecadeDistributionChartProps) {
  const t = useTranslations("CollectionStats.decadeDistribution");

  const decadeMap = data.reduce(
    (acc, item) => {
      const decade = getDecade(item.season);
      acc[decade] = (acc[decade] || 0) + item.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  const decadeData = Object.entries(decadeMap)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  if (decadeData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={decadeData.reduce(
            (acc, item) => {
              acc[item.decade] = {
                label: item.decade,
                color: DECADE_COLORS[item.decade] ?? DEFAULT_COLOR,
              };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>,
          )}
          className="h-[200px] md:h-[260px] w-full"
        >
          <BarChart
            data={decadeData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="decade"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              width={30}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">{item.decade}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("jerseyCount", { count: item.count })}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {decadeData.map((entry) => (
                <Cell
                  key={entry.decade}
                  fill={DECADE_COLORS[entry.decade] ?? DEFAULT_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
