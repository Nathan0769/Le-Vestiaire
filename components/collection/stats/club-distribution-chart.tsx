"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";

interface ClubDistributionChartProps {
  data: { club: string; count: number }[];
}

export function ClubDistributionChart({ data }: ClubDistributionChartProps) {
  const t = useTranslations("CollectionStats.clubDistribution");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
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
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="club"
              width={60}
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">{data.club}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("jerseysCount", { count: data.count })}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" fill="oklch(0.70 0.25 260)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
