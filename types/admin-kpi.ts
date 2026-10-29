export type KpiPeriod = 7 | 30 | 90;

/** `ios` = utilisateurs vus sur l'app, `web` = jamais vus sur l'app. */
export type PlatformFilter = "all" | "ios" | "web";

export type DateRange = { start: Date; end: Date };

export type KpiValue = {
  current: number;
  previous: number;
  delta: number | null;
};

/** Événements datés qu'on peut compter. Pas de posts : ils sont générés
 * automatiquement (ajout de maillot, succès, palier) et doubleraient ces actions. */
export const EVENT_METRICS = [
  "signups",
  "collection",
  "wishlist",
  "ratings",
  "likes",
  "comments",
  "follows",
  "approved",
  "rejected",
] as const;
export type EventMetric = (typeof EVENT_METRICS)[number];

/** Métriques qu'on peut tracer dans le graphique principal et détailler par jour. */
export const CHART_METRICS = [
  "active",
  "signups",
  "collection",
  "wishlist",
  "ratings",
  "likes",
  "comments",
  "follows",
] as const;
export type ChartMetric = (typeof CHART_METRICS)[number];

/** Un point par jour (`day` au format YYYY-MM-DD), une clé numérique par série. */
export type DailyPoint = { day: string } & Record<string, number | string>;

export type CohortActivityRow = {
  cohortWeek: string;
  size: number;
  weekOffset: number;
  active: number;
};

export type CohortRow = {
  cohortWeek: string;
  size: number;
  /** Part active en S+0..S+8, `null` pour une semaine pas encore commencée. */
  cells: (number | null)[];
};

export type ActivitySource = "visits" | "actions";

export type PlatformSplit = { iosOnly: number; webOnly: number; both: number };

export type AdminKpis = {
  period: KpiPeriod;
  platform: PlatformFilter;
  source: ActivitySource;
  generatedAt: string;
  /** Période courante, une clé par ChartMetric et sa valeur N jours avant en `<clé>_prev`. */
  series: DailyPoint[];
  /** Indépendant de la période choisie. */
  overview: {
    totalUsers: number;
    signupsThisMonth: KpiValue;
    dau: number;
    wau: number;
    mau: number;
    supporters: number;
    supporterShare: number;
  };
  /** Sur la période choisie, comparé à la période précédente. */
  onPeriod: Record<ChartMetric, KpiValue> & {
    activationRate: number;
    googleShare: number;
  };
  /** Actifs 30 j, jamais filtrés par plateforme (c'est la répartition elle-même). */
  platforms: PlatformSplit & { iosShare: number };
  content: {
    catalogSize: number;
    proposalsPending: number;
    proposalsApproved: number;
    proposalsRejected: number;
  };
  cohorts: CohortRow[];
};

export type KpiUser = {
  id: string;
  username: string;
  name: string;
  createdAt: string;
  platform: "ios" | "web";
};
