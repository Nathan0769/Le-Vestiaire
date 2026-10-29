import type {
  CohortActivityRow,
  CohortRow,
  DailyPoint,
  DateRange,
  KpiPeriod,
  PlatformFilter,
} from "@/types/admin-kpi";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
export const COHORT_WEEKS = 9;

const ALLOWED_PERIODS: KpiPeriod[] = [7, 30, 90];

export function parsePeriod(raw: string | string[] | undefined): KpiPeriod {
  const value = Number(typeof raw === "string" ? raw : NaN);
  return ALLOWED_PERIODS.find((p) => p === value) ?? 30;
}

export function periodRanges(
  period: KpiPeriod,
  now: Date
): { current: DateRange; previous: DateRange } {
  const span = period * DAY_MS;
  const currentStart = new Date(now.getTime() - span);
  return {
    current: { start: currentStart, end: now },
    previous: { start: new Date(currentStart.getTime() - span), end: currentStart },
  };
}

export function parsePlatform(raw: string | string[] | undefined): PlatformFilter {
  return raw === "ios" || raw === "web" ? raw : "all";
}

/**
 * Mois en cours (du 1er à maintenant, UTC) et même durée au début du mois
 * précédent, sans déborder sur le mois en cours (31 mars vs février).
 */
export function monthToDateRanges(now: Date): { current: DateRange; previous: DateRange } {
  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const elapsed = now.getTime() - currentStart.getTime();
  return {
    current: { start: currentStart, end: now },
    previous: {
      start: previousStart,
      end: new Date(Math.min(previousStart.getTime() + elapsed, currentStart.getTime())),
    },
  };
}

/**
 * Coupe une série journalière de 2N+1 jours en ses N+1 derniers jours, chacun
 * enrichi de la valeur N jours plus tôt (`<clé>_prev`) pour superposer la
 * période précédente sur le même axe.
 */
export function splitComparisonSeries(
  points: DailyPoint[],
  period: number,
  keys: readonly string[]
): DailyPoint[] {
  return points.slice(period).map((point, i) => {
    const previous = points[i];
    const merged: DailyPoint = { ...point };
    for (const key of keys) merged[`${key}_prev`] = Number(previous?.[key] ?? 0);
    return merged;
  });
}

export function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

/**
 * Transforme les lignes (cohorte, semaine S+k, actifs) en matrice de rétention.
 * Une semaine pas encore commencée vaut `null` pour la distinguer d'une
 * semaine écoulée sans aucun actif (0).
 */
export function buildCohortMatrix(rows: CohortActivityRow[], now: Date): CohortRow[] {
  const byCohort = new Map<string, CohortRow>();

  for (const row of rows) {
    let cohort = byCohort.get(row.cohortWeek);
    if (!cohort) {
      const start = new Date(`${row.cohortWeek}T00:00:00Z`).getTime();
      cohort = {
        cohortWeek: row.cohortWeek,
        size: row.size,
        cells: Array.from({ length: COHORT_WEEKS }, (_, k) =>
          start + k * WEEK_MS <= now.getTime() ? 0 : null
        ),
      };
      byCohort.set(row.cohortWeek, cohort);
    }
    if (row.weekOffset < COHORT_WEEKS && cohort.cells[row.weekOffset] !== null && row.size > 0) {
      cohort.cells[row.weekOffset] = row.active / row.size;
    }
  }

  return [...byCohort.values()].sort((a, b) => b.cohortWeek.localeCompare(a.cohortWeek));
}

/** Complète une série journalière : un point par jour UTC de la fenêtre, 0 si absent. */
export function fillDailySeries(
  rows: DailyPoint[],
  range: DateRange,
  keys: readonly string[]
): DailyPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const points: DailyPoint[] = [];
  const cursor = new Date(range.start.toISOString().slice(0, 10) + "T00:00:00Z");
  const lastDay = range.end.toISOString().slice(0, 10);

  while (cursor.toISOString().slice(0, 10) <= lastDay) {
    const day = cursor.toISOString().slice(0, 10);
    const found = byDay.get(day);
    const point: DailyPoint = { day };
    for (const key of keys) point[key] = Number(found?.[key] ?? 0);
    points.push(point);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return points;
}
