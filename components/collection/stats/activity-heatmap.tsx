"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Activity } from "lucide-react";
import { useState } from "react";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
}

const DAYS_FR = ["L", "M", "M", "J", "V", "S", "D"];

function getColor(count: number): string | undefined {
  if (count === 0) return undefined;
  if (count === 1) return "oklch(0.82 0.13 260)";
  if (count === 2) return "oklch(0.68 0.22 260)";
  return "oklch(0.52 0.28 260)";
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const t = useTranslations("CollectionStats.activityHeatmap");
  const [selected, setSelected] = useState<{ dateStr: string; count: number } | null>(null);

  const activityMap = new Map(data.map((d) => [d.date, d.count]));

  // Start of the grid: Monday 52 weeks ago
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 52 * 7);
  const dow = startDate.getDay();
  startDate.setDate(startDate.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks: Array<Array<{ dateStr: string; count: number; future: boolean }>> = [];
  const cur = new Date(startDate);

  while (cur <= today) {
    const week: Array<{ dateStr: string; count: number; future: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split("T")[0];
      week.push({
        dateStr,
        count: cur > today ? 0 : (activityMap.get(dateStr) ?? 0),
        future: cur > today,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month label: only on the 2nd week of each month to avoid overlap on narrow cells
  const monthLabels = weeks.map((week, i) => {
    const curMonth = week[0].dateStr.slice(5, 7);
    const prevMonth = i > 0 ? weeks[i - 1][0].dateStr.slice(5, 7) : null;
    if (curMonth !== prevMonth) {
      // Skip first occurrence if it falls in the first column (no space for label)
      if (i === 0) return null;
      const d = new Date(week[0].dateStr + "T12:00:00");
      return d.toLocaleDateString("fr-FR", { month: "short" });
    }
    return null;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="inline-flex flex-col gap-1 min-w-max">
            {/* Month labels */}
            <div className="flex gap-1 pl-6">
              {weeks.map((_, i) => (
                <div
                  key={i}
                  className="w-3 shrink-0 text-[9px] text-muted-foreground overflow-visible whitespace-nowrap"
                >
                  {monthLabels[i] ?? ""}
                </div>
              ))}
            </div>

            {/* Day rows Mon → Sun */}
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
              <div key={dayIndex} className="flex items-center gap-1">
                <span className="w-5 shrink-0 text-[9px] text-muted-foreground text-right">
                  {[0, 2, 4].includes(dayIndex) ? DAYS_FR[dayIndex] : ""}
                </span>
                {weeks.map((week, wi) => {
                  const cell = week[dayIndex];
                  if (!cell || cell.future) {
                    return (
                      <div key={wi} className="w-3 h-3 rounded-sm shrink-0 opacity-0" />
                    );
                  }
                  const bg = getColor(cell.count);
                  const isSelected = selected?.dateStr === cell.dateStr;
                  return (
                    <div
                      key={wi}
                      className={`w-3 h-3 rounded-sm shrink-0 cursor-pointer transition-opacity hover:opacity-75${bg ? "" : " bg-muted"}${isSelected ? " ring-1 ring-foreground/40" : ""}`}
                      style={bg ? { backgroundColor: bg } : undefined}
                      onMouseEnter={() => setSelected(cell)}
                      onClick={() => setSelected(isSelected ? null : cell)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Info line — hover on desktop, tap on mobile */}
        <div className="mt-3 h-4 text-xs text-center text-muted-foreground">
          {selected && (
            <>
              <span className="font-medium text-foreground">
                {new Date(selected.dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {" · "}
              {selected.count === 0
                ? t("noJersey")
                : t("jerseyCount", { count: selected.count })}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{t("less")}</span>
          {[0, 1, 2, 3].map((level) => {
            const bg = getColor(level);
            return (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm${bg ? "" : " bg-muted"}`}
                style={bg ? { backgroundColor: bg } : undefined}
              />
            );
          })}
          <span>{t("more")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
