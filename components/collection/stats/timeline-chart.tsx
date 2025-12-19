"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";

interface TimelineChartProps {
  data: { month: string; count: number }[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  const t = useTranslations("CollectionStats.timeline");

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
          <Calendar className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
            config={{
              count: {
                label: t("acquisitions"),
                color: "oklch(0.70 0.25 260)",
              },
            }}
            className="h-[200px] md:h-[300px] w-full"
          >
          <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
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
              width={30}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const count = payload[0].value as number;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">
                      {payload[0].payload.monthLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("jerseysAdded", { count })}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="oklch(0.70 0.25 260)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
