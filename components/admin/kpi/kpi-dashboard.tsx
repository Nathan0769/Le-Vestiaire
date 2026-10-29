"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiTile } from "@/components/admin/kpi/kpi-tile";
import { KpiComparisonChart } from "@/components/admin/kpi/kpi-comparison-chart";
import { CohortTable, formatWeek } from "@/components/admin/kpi/cohort-table";
import { PlatformSplitBar } from "@/components/admin/kpi/platform-split-bar";
import { KpiUsersSheet, type KpiUsersQuery } from "@/components/admin/kpi/kpi-users-sheet";
import type { AdminKpis, ChartMetric } from "@/types/admin-kpi";

const percent = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("fr-FR");

const METRIC_LABELS: Record<ChartMetric, string> = {
  active: "Actifs",
  signups: "Inscriptions",
  collection: "Maillots ajoutés",
  wishlist: "Ajouts wishlist",
  ratings: "Notes",
  likes: "Likes",
  comments: "Commentaires",
  follows: "Follows",
};

const EXCLUDED = "Hors staff et comptes bannis.";

const ACTIVE_INFO = {
  visits: "Actif = a ouvert l'app ou le site connecté au moins une fois sur la fenêtre.",
  actions:
    "Actif = a ajouté un maillot, mis en wishlist, noté, liké, commenté ou suivi quelqu'un sur la fenêtre. Les posts automatiques ne comptent pas.",
} as const;

const METRIC_INFO: Record<Exclude<ChartMetric, "active">, string> = {
  signups: "Comptes créés sur la période.",
  collection: "Maillots ajoutés à une collection.",
  wishlist: "Maillots ajoutés à une wishlist.",
  ratings: "Maillots notés (une note par utilisateur et par maillot).",
  likes: "Likes posés sur des posts du feed.",
  comments: "Commentaires publiés, hors commentaires supprimés.",
  follows: "Abonnements à un autre collectionneur.",
};

const PLATFORM_LABELS = { all: "", ios: " · iOS", web: " · Web" } as const;

function formatLongDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 grid-cols-2 md:grid-cols-4">{children}</div>;
}

export function KpiDashboard({ kpis }: { kpis: AdminKpis }) {
  const [selected, setSelected] = useState<ChartMetric>("active");
  const [detail, setDetail] = useState<KpiUsersQuery | null>(null);
  const { overview, onPeriod, platforms, content, period, platform, source } = kpis;
  const activeInfo = `${ACTIVE_INFO[source]} ${EXCLUDED}`;

  const metricTile = (metric: ChartMetric, hint?: string) => (
    <KpiTile
      key={metric}
      label={METRIC_LABELS[metric]}
      value={onPeriod[metric]}
      hint={hint}
      info={metric === "active" ? activeInfo : `${METRIC_INFO[metric]} ${EXCLUDED}`}
      onSelect={() => setSelected(metric)}
      selected={selected === metric}
    />
  );

  const openDay = (day: string) =>
    setDetail({
      title: `${METRIC_LABELS[selected]}${PLATFORM_LABELS[platform]}`,
      description: formatLongDay(day),
      params: { metric: selected, day, platform },
    });

  const openCohort = (cohortWeek: string, offset: number) =>
    setDetail({
      title: `Cohorte du ${formatWeek(cohortWeek)}${PLATFORM_LABELS[platform]}`,
      description: `Actifs en S+${offset}`,
      params: { cohort: cohortWeek, offset: String(offset), platform },
    });

  return (
    <div className="space-y-8">
      <Section title="Vue d'ensemble" description="État actuel, quelle que soit la période choisie.">
        <TileGrid>
          <KpiTile label="Utilisateurs" value={overview.totalUsers} info={`Comptes existants. ${EXCLUDED}`} />
          <KpiTile
            label="Inscriptions ce mois"
            value={overview.signupsThisMonth}
            info={`Du 1er du mois à maintenant, comparé au mois dernier sur le même nombre de jours. ${EXCLUDED}`}
          />
          <KpiTile
            label="Actifs 30 j"
            value={overview.mau}
            hint={`Aujourd'hui ${number.format(overview.dau)} · 7 j ${number.format(overview.wau)}`}
            info={activeInfo}
          />
          <KpiTile
            label="Supporters"
            value={overview.supporters}
            hint={`${percent.format(overview.supporterShare)} des utilisateurs`}
            info={`Abonnement Supporter actif. ${EXCLUDED}`}
          />
        </TileGrid>
      </Section>

      <Section
        title={`Sur ${period} jours`}
        description={`Comparé aux ${period} jours précédents. Clique une tuile pour voir sa courbe.`}
      >
        <TileGrid>
          {metricTile("signups", `${percent.format(onPeriod.googleShare)} via Google`)}
          {metricTile("active")}
          {metricTile("collection", `Activation ${percent.format(onPeriod.activationRate)}`)}
          {metricTile("wishlist")}
          {metricTile("ratings")}
          {metricTile("likes")}
          {metricTile("comments")}
          {metricTile("follows")}
        </TileGrid>
        <p className="text-xs text-muted-foreground">
          Activation = part des utilisateurs avec au moins un maillot en collection.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {METRIC_LABELS[selected]} par jour
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pointillé = les {period} jours précédents. Clique un jour pour voir les utilisateurs.
            </p>
          </CardHeader>
          <CardContent>
            <KpiComparisonChart
              data={kpis.series}
              metric={selected}
              label={METRIC_LABELS[selected]}
              onDayClick={openDay}
            />
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Plateformes"
        description={`Actifs des 30 derniers jours, chacun compté une seule fois. ${percent.format(platforms.iosShare)} des utilisateurs ont déjà utilisé l'app iOS.`}
      >
        <Card>
          <CardContent className="pt-6">
            <PlatformSplitBar split={platforms} />
          </CardContent>
        </Card>
      </Section>

      <Section title="Contenu">
        <TileGrid>
          <KpiTile label="Maillots au catalogue" value={content.catalogSize} />
          <KpiTile
            label="Propositions de maillots"
            value={content.proposalsPending}
            hint={`En attente · sur ${period} j : ${content.proposalsApproved} approuvées, ${content.proposalsRejected} rejetées`}
          />
        </TileGrid>
      </Section>

      <Section
        title="Rétention par cohorte"
        description="Part des inscrits de chaque semaine encore actifs N semaines après. Clique une cellule pour voir qui."
      >
        <Card>
          <CardContent className="pt-6">
            <CohortTable rows={kpis.cohorts} onCellClick={openCohort} />
          </CardContent>
        </Card>
      </Section>

      <KpiUsersSheet query={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
