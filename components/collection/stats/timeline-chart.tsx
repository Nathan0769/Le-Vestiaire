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

  const formattedData = data.reduce(
    (acc, item) => {
      const prev = acc[acc.length - 1]?.total ?? 0;
      const [year, month] = item.month.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      acc.push({
        ...item,
        total: prev + item.count,
        monthLabel: date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        }),
      });
      return acc;
    },
    [] as Array<(typeof data)[0] & { total: number; monthLabel: string }>
  );

  return (
    <Card>
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0 min-w-0 overflow-hidden">
        <ChartContainer
            config={{
              total: {
                label: t("totalJerseys"),
                color: "oklch(0.70 0.25 260)",
              },
            }}
            className="h-[180px] md:h-[300px] w-full"
          >
          <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
              width={40}
              domain={[0, "auto"]}
              allowDecimals={false}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg space-y-1">
                    <p className="text-sm font-medium">{d.monthLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("totalJerseys")}: <span className="font-medium text-foreground">{d.total}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("jerseysAdded", { count: d.count })}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
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
