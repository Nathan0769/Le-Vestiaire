"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { KpiPeriod, PlatformFilter } from "@/types/admin-kpi";

const PERIODS: KpiPeriod[] = [7, 30, 90];
const PLATFORMS: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "ios", label: "iOS" },
  { value: "web", label: "Web" },
];

interface KpiFiltersProps {
  period: KpiPeriod;
  platform: PlatformFilter;
}

export function KpiFilters({ period, platform }: KpiFiltersProps) {
  const router = useRouter();
  const go = (next: Partial<KpiFiltersProps>) => {
    const params = new URLSearchParams({
      period: String(next.period ?? period),
      platform: next.platform ?? platform,
    });
    router.replace(`?${params}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="inline-flex gap-1 rounded-lg border p-1">
        {PLATFORMS.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={p.value === platform ? "default" : "ghost"}
            className="cursor-pointer"
            onClick={() => go({ platform: p.value })}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="inline-flex gap-1 rounded-lg border p-1">
        {PERIODS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === period ? "default" : "ghost"}
            className="cursor-pointer"
            onClick={() => go({ period: p })}
          >
            {p} j
          </Button>
        ))}
      </div>
    </div>
  );
}
