"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ChartMetric, DailyPoint } from "@/types/admin-kpi";

interface KpiComparisonChartProps {
  data: DailyPoint[];
  metric: ChartMetric;
  label: string;
  onDayClick: (day: string) => void;
}

function formatDay(day: string) {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export function KpiComparisonChart({ data, metric, label, onDayClick }: KpiComparisonChartProps) {
  const previousKey = `${metric}_prev`;
  const config: ChartConfig = {
    [metric]: { label, color: "var(--chart-1)" },
    [previousKey]: { label: "Période précédente", color: "var(--muted-foreground)" },
  };

  return (
    <ChartContainer config={config} className="h-[240px] md:h-[320px] w-full">
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        className="cursor-pointer"
        onClick={(state) => {
          if (typeof state?.activeLabel === "string") onDayClick(state.activeLabel);
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="day"
          tickFormatter={formatDay}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(d) => formatDay(String(d))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey={previousKey}
          type="monotone"
          stroke={`var(--color-${previousKey})`}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
        <Line
          dataKey={metric}
          type="monotone"
          stroke={`var(--color-${metric})`}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
