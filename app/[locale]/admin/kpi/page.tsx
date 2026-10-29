import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminKpis } from "@/lib/admin/kpi";
import { parsePeriod, parsePlatform } from "@/lib/admin/kpi-math";
import { Badge } from "@/components/ui/badge";
import { KpiFilters } from "@/components/admin/kpi/kpi-filters";
import { KpiDashboard } from "@/components/admin/kpi/kpi-dashboard";

export default async function AdminKpiPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[]; platform?: string | string[] }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const platform = parsePlatform(params.platform);
  const kpis = await getAdminKpis(period, platform);
  const dataUntil = new Date(kpis.generatedAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <h2 className="text-2xl font-bold">KPI</h2>
          <p className="text-sm text-muted-foreground">
            Données arrêtées à {dataUntil} (recalcul toutes les heures) ·{" "}
            <Badge variant="outline">
              Actifs : {kpis.source === "visits" ? "visites" : "actions"}
            </Badge>
          </p>
        </div>
        <KpiFilters period={period} platform={platform} />
      </div>

      <KpiDashboard kpis={kpis} />
    </div>
  );
}
