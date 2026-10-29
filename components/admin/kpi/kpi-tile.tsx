import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { KpiValue } from "@/types/admin-kpi";

const numberFormat = new Intl.NumberFormat("fr-FR");
const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

interface KpiTileProps {
  label: string;
  /** Un nombre brut, ou un KpiValue pour afficher la variation vs période précédente. */
  value: number | KpiValue;
  format?: "number" | "percent";
  hint?: string;
  /** Définition exacte de la métrique, affichée au survol de l'icône. */
  info?: string;
  /** Rend la tuile cliquable (affiche sa courbe dans le graphique principal). */
  onSelect?: () => void;
  selected?: boolean;
}

export function KpiTile({ label, value, format = "number", hint, info, onSelect, selected }: KpiTileProps) {
  const current = typeof value === "number" ? value : value.current;
  const variation = typeof value === "number" ? undefined : value.delta;
  const formatted =
    format === "percent" ? percentFormat.format(current) : numberFormat.format(current);

  const content = (
    <Card
      className={cn(
        "py-4 h-full transition-colors",
        onSelect && "hover:border-foreground/30",
        selected && "border-primary ring-1 ring-primary"
      )}
    >
      <CardContent className="px-4 space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{label}</span>
          {info && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} aria-label={info} className="inline-flex cursor-help">
                  <Info className="h-3 w-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{info}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-2xl font-bold tabular-nums">{formatted}</p>
        {variation !== undefined && (
          <p
            className={
              variation === null
                ? "text-xs text-muted-foreground"
                : variation >= 0
                  ? "text-xs text-emerald-600 dark:text-emerald-400"
                  : "text-xs text-red-600 dark:text-red-400"
            }
          >
            {variation === null
              ? "- vs période précédente"
              : `${variation >= 0 ? "+" : ""}${percentFormat.format(variation)} vs période précédente`}
          </p>
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );

  if (!onSelect) return content;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </button>
  );
}
