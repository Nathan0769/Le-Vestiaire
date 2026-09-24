"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface HistoryPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

type Period = "1M" | "6M" | "1Y" | "ALL";

const PERIODS: { key: Period; tKey: string; days: number | null }[] = [
  { key: "1M", tKey: "period1M", days: 31 },
  { key: "6M", tKey: "period6M", days: 183 },
  { key: "1Y", tKey: "period1Y", days: 366 },
  { key: "ALL", tKey: "periodAll", days: null },
];

const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

// Or (pas orange) : hue jaune ~90, chroma modérée. Lisible clair comme sombre.
const GOLD = "oklch(0.76 0.115 90)";

export function MarketValueChart() {
  const t = useTranslations("MarketValue");
  const [period, setPeriod] = useState<Period>("1Y");

  const { data, isLoading } = useQuery<{ points: HistoryPoint[] }>({
    queryKey: ["collection-value-history"],
    queryFn: async () => {
      const res = await fetch("/api/user/collection-value-history");
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });

  const points = useMemo(() => {
    const all = data?.points ?? [];
    const days = PERIODS.find((p) => p.key === period)?.days ?? null;
    if (days == null) return all;
    const cutoff = Date.now() - days * 86400000;
    return all.filter((p) => new Date(p.date).getTime() >= cutoff);
  }, [data, period]);

  const chartData = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: new Date(p.date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
      })),
    [points]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          {t("chartTitle")}
        </CardTitle>
        <div className="flex gap-0.5 self-end rounded-lg bg-muted p-0.5 sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                period === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(p.tKey)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        {isLoading ? (
          <div className="h-[220px] animate-pulse rounded-lg bg-muted" />
        ) : chartData.length < 2 ? (
          <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("buildingTitle")}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">{t("buildingText")}</p>
          </div>
        ) : (
          <ChartContainer
            config={{ value: { label: t("sortValue"), color: GOLD } }}
            className="h-[220px] w-full md:h-[280px]"
          >
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="mv-gold-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                minTickGap={32}
              />
              <YAxis
                width={48}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) => eur(Number(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelKey="label"
                    formatter={(value) => eur(Number(value))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={GOLD}
                strokeWidth={2.5}
                fill="url(#mv-gold-fill)"
                dot={false}
                activeDot={{ r: 4, fill: GOLD }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
