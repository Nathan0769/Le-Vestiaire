import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CollectionStatsView } from "@/components/collection/stats/collection-stats-view";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title:
    "Statistiques de Collection | Le Vestiaire - Analysez votre Collection de Maillots",
  description:
    "Visualisez des statistiques détaillées sur votre collection de maillots : graphiques, tendances, valeur financière et bien plus encore.",
  keywords: [
    "statistiques collection maillots",
    "analyse collection football",
    "graphiques maillots",
    "valeur collection",
    "tendances maillots",
  ],
};

export const revalidate = 3600;

export default async function CollectionStatsPage() {
  const t = await getTranslations("CollectionStats");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      <CollectionStatsView />
    </div>
  );
}
