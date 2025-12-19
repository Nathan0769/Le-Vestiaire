"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Ruler } from "lucide-react";

interface SizeDistributionChartProps {
  data: { size: string; count: number }[];
}

export function SizeDistributionChart({ data }: SizeDistributionChartProps) {
  const t = useTranslations("CollectionStats.sizeDistribution");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
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
          className="h-[200px] md:h-[300px] w-full"
        >
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="size"
              className="text-xs"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              className="text-[10px]"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              width={30}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">Taille {data.size}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("jerseysCount", { count: data.count })}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" fill="oklch(0.70 0.25 260)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
