import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  buildCohortMatrix,
  COHORT_WEEKS,
  delta,
  fillDailySeries,
  monthToDateRanges,
  periodRanges,
  splitComparisonSeries,
} from "@/lib/admin/kpi-math";
import {
  CHART_METRICS,
  type ActivitySource,
  type AdminKpis,
  type ChartMetric,
  type CohortActivityRow,
  type DailyPoint,
  type DateRange,
  type EventMetric,
  type KpiPeriod,
  type KpiUser,
  type KpiValue,
  type PlatformFilter,
  type PlatformSplit,
} from "@/types/admin-kpi";

const DAY_MS = 86_400_000;
// En dessous, la table de visites est trop jeune pour des actifs fiables
const MIN_VISIT_DAYS = 7;
const MAX_DETAIL_USERS = 100;

/**
 * Où lire chaque métrique. Seule source des identifiants SQL injectés en
 * Prisma.raw : aucune valeur venant d'une requête HTTP n'y arrive.
 */
const EVENT_SOURCES: Record<EventMetric, { table: string; user: string; at: string; where?: string }> = {
  signups: { table: `"user"`, user: "id", at: `"createdAt"` },
  collection: { table: "user_jerseys", user: `"userId"`, at: `"createdAt"` },
  wishlist: { table: "wishlist", user: `"userId"`, at: `"createdAt"` },
  ratings: { table: "ratings", user: `"userId"`, at: `"createdAt"` },
  likes: { table: "post_likes", user: "user_id", at: "created_at" },
  comments: { table: "post_comments", user: "author_id", at: "created_at", where: "deleted_at IS NULL" },
  follows: { table: "follows", user: "follower_id", at: "created_at" },
  approved: { table: "contribution_history", user: `"userId"`, at: `"createdAt"`, where: "action = 'APPROVED'" },
  rejected: { table: "contribution_history", user: `"userId"`, at: `"createdAt"`, where: "action = 'REJECTED'" },
};

/**
 * Les actions qui rendent un utilisateur "actif" en source actions. Pas de
 * posts : ils sont générés par l'ajout de maillot, déjà compté.
 */
const ACTION_METRICS: EventMetric[] = [
  "collection",
  "wishlist",
  "ratings",
  "likes",
  "comments",
  "follows",
];

/** Métriques événementielles du graphique (tout CHART_METRICS sauf "active"). */
const CHART_EVENT_METRICS = CHART_METRICS.filter(
  (m): m is Exclude<ChartMetric, "active"> => m !== "active"
);

// Le staff (dont l'activité d'admin) et les comptes bannis faussent les KPI
const EXCLUDED_USERS = Prisma.sql`
  SELECT id FROM "user" WHERE banned OR role IN ('admin', 'superadmin')
`;

// Seule l'app s'authentifie en Bearer et ses sessions portent un userAgent
// CFNetwork ; le token push et les visites iOS complètent l'historique.
const IOS_USERS = Prisma.sql`
  SELECT "userId" AS user_id FROM push_tokens WHERE platform = 'ios'
  UNION SELECT "userId" FROM sessions WHERE "userAgent" ILIKE '%CFNetwork%'
  UNION SELECT user_id FROM user_activity_days WHERE platform = 'ios'
`;

const WEB_USERS = Prisma.sql`
  SELECT "userId" AS user_id FROM sessions WHERE "userAgent" NOT ILIKE '%CFNetwork%'
  UNION SELECT user_id FROM user_activity_days WHERE platform = 'web'
`;

/** Exclut toujours staff et bannis, puis filtre sur la classification iOS / web. */
function userFilter(column: Prisma.Sql, platform: PlatformFilter): Prisma.Sql {
  const excluded = Prisma.sql`AND ${column} NOT IN (${EXCLUDED_USERS})`;
  if (platform === "ios") return Prisma.sql`${excluded} AND ${column} IN (${IOS_USERS})`;
  if (platform === "web") return Prisma.sql`${excluded} AND ${column} NOT IN (${IOS_USERS})`;
  return excluded;
}

function events(metric: EventMetric, since: Date, platform: PlatformFilter): Prisma.Sql {
  const source = EVENT_SOURCES[metric];
  const user = Prisma.raw(source.user);
  const at = Prisma.raw(source.at);
  const extra = source.where ? Prisma.raw(`AND ${source.where}`) : Prisma.empty;
  return Prisma.sql`
    SELECT ${user} AS user_id, ${at} AS at FROM ${Prisma.raw(source.table)}
    WHERE ${at} >= ${since} ${extra} ${userFilter(user, platform)}
  `;
}

// Les visites sont au jour près : on prend les jours calendaires après `since`,
// pour que "1 jour" = aujourd'hui et non hier + aujourd'hui. Le filtre porte sur
// la plateforme de la visite elle-même, plus précis que la classification.
function activity(source: ActivitySource, since: Date, platform: PlatformFilter): Prisma.Sql {
  if (source === "visits") {
    const platformFilter = platform === "all" ? Prisma.empty : Prisma.sql`AND platform = ${platform}`;
    return Prisma.sql`
      SELECT user_id, day::timestamp AS at FROM user_activity_days
      WHERE day > ${since}::date ${platformFilter} ${userFilter(Prisma.raw("user_id"), "all")}
    `;
  }
  return Prisma.join(
    ACTION_METRICS.map((m) => events(m, since, platform)),
    " UNION ALL "
  );
}

export async function countEvents(
  metric: EventMetric,
  range: DateRange,
  platform: PlatformFilter
): Promise<number> {
  const [row] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM (${events(metric, range.start, platform)}) e
    WHERE e.at < ${range.end}
  `;
  return Number(row.n);
}

export async function countActiveUsers(
  range: DateRange,
  source: ActivitySource,
  platform: PlatformFilter
): Promise<number> {
  const [row] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(DISTINCT user_id)::bigint AS n
    FROM (${activity(source, range.start, platform)}) a
    WHERE a.at < ${range.end}
  `;
  return Number(row.n);
}

/**
 * Répartition des actifs par plateforme, sans double compte : chaque actif
 * tombe dans une seule case. En source visites, d'après les visites de la
 * fenêtre ; en source actions, d'après tout ce qu'on sait de l'utilisateur
 * (un utilisateur jamais vu sur l'app est compté web).
 */
export async function getPlatformSplit(
  range: DateRange,
  source: ActivitySource
): Promise<PlatformSplit> {
  const platforms =
    source === "visits"
      ? Prisma.sql`
          SELECT user_id, bool_or(platform = 'ios') AS ios, bool_or(platform = 'web') AS web
          FROM user_activity_days
          WHERE day > ${range.start}::date AND day::timestamp < ${range.end}
          GROUP BY user_id
        `
      : Prisma.sql`
          SELECT user_id,
                 user_id IN (${IOS_USERS}) AS ios,
                 (user_id IN (${WEB_USERS}) OR user_id NOT IN (${IOS_USERS})) AS web
          FROM active
        `;
  const [row] = await prisma.$queryRaw<{ ios_only: bigint; web_only: bigint; both: bigint }[]>`
    WITH active AS (
      SELECT DISTINCT user_id FROM (${activity(source, range.start, "all")}) a
      WHERE a.at < ${range.end}
    ),
    platforms AS (${platforms})
    SELECT COUNT(*) FILTER (WHERE p.ios AND NOT p.web)::bigint AS ios_only,
           COUNT(*) FILTER (WHERE p.web AND NOT p.ios)::bigint AS web_only,
           COUNT(*) FILTER (WHERE p.ios AND p.web)::bigint AS both
    FROM active a JOIN platforms p ON p.user_id = a.user_id
  `;
  return { iosOnly: Number(row.ios_only), webOnly: Number(row.web_only), both: Number(row.both) };
}

export async function pickActivitySource(): Promise<ActivitySource> {
  const [row] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(DISTINCT day)::bigint AS n FROM user_activity_days
  `;
  return Number(row.n) >= MIN_VISIT_DAYS ? "visits" : "actions";
}

/**
 * Une ligne par (cohorte, utilisateur, semaine S+k d'activité). Un inscrit sans
 * activité remonte quand même (S+0, `active_user` null) grâce au LEFT JOIN,
 * pour que la taille de cohorte reste juste.
 */
function cohortBase(now: Date, source: ActivitySource, platform: PlatformFilter): Prisma.Sql {
  const firstCohort = new Date(now.getTime() - (COHORT_WEEKS - 1) * 7 * DAY_MS);
  return Prisma.sql`
    WITH cohort AS (
      SELECT id AS user_id, "createdAt" AS signed_up_at,
             date_trunc('week', "createdAt") AS cohort_week
      FROM "user"
      WHERE "createdAt" >= date_trunc('week', ${firstCohort}::timestamp)
        AND "createdAt" < ${now}
        ${userFilter(Prisma.raw("id"), platform)}
    ),
    act AS (${activity(source, new Date(firstCohort.getTime() - 7 * DAY_MS), platform)})
    SELECT c.cohort_week,
           c.user_id,
           COALESCE(GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (a.at - c.signed_up_at)) / 604800)), 0)::int AS week_offset,
           a.user_id AS active_user
    FROM cohort c
    LEFT JOIN act a ON a.user_id = c.user_id
                   AND a.at >= date_trunc('day', c.signed_up_at)
                   AND a.at < ${now}
  `;
}

export async function getCohortRows(
  now: Date,
  source: ActivitySource,
  platform: PlatformFilter
): Promise<CohortActivityRow[]> {
  const rows = await prisma.$queryRaw<
    { cohort_week: string; size: bigint; week_offset: number; active: bigint }[]
  >`
    WITH base AS (${cohortBase(now, source, platform)}),
    sizes AS (
      SELECT cohort_week, COUNT(DISTINCT user_id)::bigint AS size FROM base GROUP BY cohort_week
    )
    SELECT to_char(b.cohort_week, 'YYYY-MM-DD') AS cohort_week, s.size, b.week_offset,
           COUNT(DISTINCT b.active_user)::bigint AS active
    FROM base b JOIN sizes s ON s.cohort_week = b.cohort_week
    GROUP BY 1, 2, 3
  `;
  return rows.map((r) => ({
    cohortWeek: r.cohort_week,
    size: Number(r.size),
    weekOffset: r.week_offset,
    active: Number(r.active),
  }));
}

async function toKpiUsers(ids: string[]): Promise<KpiUser[]> {
  if (ids.length === 0) return [];
  const [users, iosRows] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.$queryRaw<{ user_id: string }[]>`
      SELECT user_id FROM (${IOS_USERS}) i WHERE user_id IN (${Prisma.join(ids)})
    `,
  ]);
  const iosIds = new Set(iosRows.map((r) => r.user_id));
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
    platform: iosIds.has(u.id) ? "ios" : "web",
  }));
}

/** Utilisateurs derrière un point du graphique : une métrique, un jour UTC. */
export async function getMetricUsers(params: {
  metric: ChartMetric;
  day: string;
  platform: PlatformFilter;
  source: ActivitySource;
}): Promise<KpiUser[]> {
  const dayStart = new Date(`${params.day}T00:00:00Z`);
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);
  // 1 ms avant minuit : le filtre des visites (`day > since::date`) inclut alors ce jour
  const since = new Date(dayStart.getTime() - 1);
  const query =
    params.metric === "active"
      ? activity(params.source, since, params.platform)
      : events(params.metric, since, params.platform);

  const rows = await prisma.$queryRaw<{ user_id: string }[]>`
    SELECT DISTINCT user_id FROM (${query}) q
    WHERE q.at >= ${dayStart} AND q.at < ${dayEnd}
    LIMIT ${MAX_DETAIL_USERS}
  `;
  return toKpiUsers(rows.map((r) => r.user_id));
}

/** Utilisateurs actifs d'une cellule de cohorte (semaine d'inscription, S+k). */
export async function getCohortUsers(params: {
  cohortWeek: string;
  offset: number;
  platform: PlatformFilter;
  source: ActivitySource;
  now?: Date;
}): Promise<KpiUser[]> {
  const rows = await prisma.$queryRaw<{ user_id: string }[]>`
    WITH base AS (${cohortBase(params.now ?? new Date(), params.source, params.platform)})
    SELECT DISTINCT active_user AS user_id FROM base
    WHERE cohort_week = ${params.cohortWeek}::timestamp
      AND week_offset = ${params.offset}
      AND active_user IS NOT NULL
    LIMIT ${MAX_DETAIL_USERS}
  `;
  return toKpiUsers(rows.map((r) => r.user_id));
}

async function kpiValue(
  count: (range: DateRange) => Promise<number>,
  ranges: { current: DateRange; previous: DateRange }
): Promise<KpiValue> {
  const [current, previous] = await Promise.all([count(ranges.current), count(ranges.previous)]);
  return { current, previous, delta: delta(current, previous) };
}

/**
 * Toutes les métriques par jour sur 2 x N jours, puis coupées en période
 * courante + valeur N jours avant, pour le graphique comparatif.
 */
async function comparisonSeries(
  period: KpiPeriod,
  now: Date,
  source: ActivitySource,
  platform: PlatformFilter
): Promise<DailyPoint[]> {
  const window: DateRange = { start: new Date(now.getTime() - 2 * period * DAY_MS), end: now };
  const labelled = Prisma.join(
    CHART_EVENT_METRICS.map(
      (m) => Prisma.sql`SELECT ${m}::text AS series, at FROM (${events(m, window.start, platform)}) ${Prisma.raw(`e_${m}`)}`
    ),
    " UNION ALL "
  );

  const [eventRows, activeRows] = await Promise.all([
    prisma.$queryRaw<{ day: string; series: string; n: bigint }[]>`
      SELECT to_char(date_trunc('day', at), 'YYYY-MM-DD') AS day, series, COUNT(*)::bigint AS n
      FROM (${labelled}) t
      WHERE at < ${window.end}
      GROUP BY 1, 2
    `,
    prisma.$queryRaw<{ day: string; n: bigint }[]>`
      SELECT to_char(date_trunc('day', at), 'YYYY-MM-DD') AS day, COUNT(DISTINCT user_id)::bigint AS n
      FROM (${activity(source, window.start, platform)}) a
      WHERE at < ${window.end}
      GROUP BY 1
    `,
  ]);

  const byDay = new Map<string, DailyPoint>();
  const point = (day: string) => {
    const existing = byDay.get(day) ?? { day };
    byDay.set(day, existing);
    return existing;
  };
  for (const row of eventRows) point(row.day)[row.series] = Number(row.n);
  for (const row of activeRows) point(row.day).active = Number(row.n);

  const filled = fillDailySeries([...byDay.values()], window, CHART_METRICS);
  return splitComparisonSeries(filled, period, CHART_METRICS);
}

async function countUsers(platform: PlatformFilter, where: Prisma.Sql = Prisma.empty) {
  const [row] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "user"
    WHERE TRUE ${where} ${userFilter(Prisma.raw("id"), platform)}
  `;
  return Number(row.n);
}

const ratio = (part: number, total: number) => (total === 0 ? 0 : part / total);

async function computeAdminKpis(
  period: KpiPeriod,
  platform: PlatformFilter,
  nowIso: string
): Promise<AdminKpis> {
  const now = new Date(nowIso);
  const ranges = periodRanges(period, now);
  const source = await pickActivitySource();
  const lastDays = (n: number): DateRange => ({ start: new Date(now.getTime() - n * DAY_MS), end: now });
  const onRanges = (m: EventMetric) => kpiValue((r) => countEvents(m, r, platform), ranges);

  const [
    totalUsers,
    allUsers,
    iosUsers,
    activatedUsers,
    supporters,
    signupsThisMonth,
    dau,
    wau,
    mau,
    split,
    active,
    eventValues,
    googleSignups,
    catalogSize,
    proposalsPending,
    proposalsApproved,
    proposalsRejected,
    cohortRows,
    series,
  ] = await Promise.all([
    countUsers(platform),
    countUsers("all"),
    countUsers("ios"),
    countUsers(platform, Prisma.sql`AND id IN (SELECT "userId" FROM user_jerseys)`),
    countUsers(platform, Prisma.sql`AND plan = 'PRO'`),
    kpiValue((r) => countEvents("signups", r, platform), monthToDateRanges(now)),
    countActiveUsers(lastDays(1), source, platform),
    countActiveUsers(lastDays(7), source, platform),
    countActiveUsers(lastDays(30), source, platform),
    getPlatformSplit(lastDays(30), source),
    kpiValue((r) => countActiveUsers(r, source, platform), ranges),
    Promise.all(CHART_EVENT_METRICS.map(onRanges)),
    countUsers(
      platform,
      Prisma.sql`
        AND "createdAt" >= ${ranges.current.start} AND "createdAt" < ${ranges.current.end}
        AND id IN (SELECT "userId" FROM accounts WHERE "providerId" = 'google')
      `
    ),
    prisma.jersey.count(),
    prisma.jerseyProposal.count(),
    countEvents("approved", ranges.current, platform),
    countEvents("rejected", ranges.current, platform),
    getCohortRows(now, source, platform),
    comparisonSeries(period, now, source, platform),
  ]);

  const byMetric = Object.fromEntries(
    CHART_EVENT_METRICS.map((m, i) => [m, eventValues[i]])
  ) as Record<Exclude<ChartMetric, "active">, KpiValue>;

  return {
    period,
    platform,
    source,
    generatedAt: now.toISOString(),
    series,
    overview: {
      totalUsers,
      signupsThisMonth,
      dau,
      wau,
      mau,
      supporters,
      supporterShare: ratio(supporters, totalUsers),
    },
    onPeriod: {
      active,
      ...byMetric,
      activationRate: ratio(activatedUsers, totalUsers),
      googleShare: ratio(googleSignups, byMetric.signups.current),
    },
    platforms: { ...split, iosShare: ratio(iosUsers, allUsers) },
    content: { catalogSize, proposalsPending, proposalsApproved, proposalsRejected },
    cohorts: buildCohortMatrix(cohortRows, now),
  };
}

const cachedAdminKpis = unstable_cache(computeAdminKpis, ["admin-kpis"], {
  revalidate: 3600,
});

/**
 * KPI du dashboard admin, en cache 1 h par période et plateforme pour ne pas
 * relancer une quarantaine d'agrégats (et réveiller Neon) à chaque affichage.
 */
export function getAdminKpis(period: KpiPeriod, platform: PlatformFilter): Promise<AdminKpis> {
  // L'heure arrondie entre dans la clé de cache : sans ça, chaque appel aurait sa propre clé
  const hour = new Date();
  hour.setUTCMinutes(0, 0, 0);
  return cachedAdminKpis(period, platform, hour.toISOString());
}
