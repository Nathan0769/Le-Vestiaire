import type { PlatformSplit } from "@/types/admin-kpi";

const percentFormat = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });

const SEGMENTS: { key: keyof PlatformSplit; label: string; color: string }[] = [
  { key: "iosOnly", label: "iOS seulement", color: "var(--chart-1)" },
  { key: "both", label: "Les deux", color: "var(--chart-3)" },
  { key: "webOnly", label: "Web seulement", color: "var(--chart-2)" },
];

/** Barre empilée : chaque actif est dans une seule case, la somme = total des actifs. */
export function PlatformSplitBar({ split }: { split: PlatformSplit }) {
  const total = split.iosOnly + split.webOnly + split.both;

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Aucun actif sur 30 jours.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {SEGMENTS.map(({ key, color }) =>
          split[key] > 0 ? (
            <div key={key} style={{ width: `${(split[key] / total) * 100}%`, backgroundColor: color }} />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {SEGMENTS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold tabular-nums">{split[key]}</span>
            <span className="text-xs text-muted-foreground">{percentFormat.format(split[key] / total)}</span>
          </div>
        ))}
        <div className="text-muted-foreground">
          Total <span className="font-semibold text-foreground tabular-nums">{total}</span>
        </div>
      </div>
    </div>
  );
}
