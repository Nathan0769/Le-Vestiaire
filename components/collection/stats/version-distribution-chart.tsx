"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

interface VersionDistributionChartProps {
  data: { version: string; count: number; percentage: number }[];
}

const VERSION_COLORS: Record<string, string> = {
  REPLICA: "oklch(0.65 0.08 250)",
  AUTHENTIC: "oklch(0.55 0.22 250)",
  STOCK_PRO: "oklch(0.60 0.22 290)",
  PLAYER_ISSUE: "oklch(0.70 0.22 50)",
  MATCH_WORN: "oklch(0.60 0.22 20)",
};

export function VersionDistributionChart({ data }: VersionDistributionChartProps) {
  const t = useTranslations("CollectionStats.versionDistribution");

  const formattedData = data.map((item) => ({
    ...item,
    versionLabel: t(`labels.${item.version}` as Parameters<typeof t>[0]),
    fill: VERSION_COLORS[item.version] || "oklch(0.65 0.08 250)",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={formattedData.reduce((acc, item) => {
            acc[item.version] = {
              label: item.versionLabel,
              color: item.fill,
            };
            return acc;
          }, {} as Record<string, { label: string; color: string }>)}
          className="h-[200px] md:h-[300px] w-full"
        >
          <BarChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="versionLabel"
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <YAxis
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              width={40}
              domain={[0, "auto"]}
              allowDecimals={false}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">{item.versionLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("jerseysCount", { count: item.count })} ({item.percentage}%)
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
