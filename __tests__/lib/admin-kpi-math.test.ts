import { describe, it, expect } from "vitest";
import {
  parsePeriod,
  periodRanges,
  delta,
  buildCohortMatrix,
  fillDailySeries,
  monthToDateRanges,
  splitComparisonSeries,
  parsePlatform,
} from "@/lib/admin/kpi-math";

const DAY = 86_400_000;
const NOW = new Date("2026-10-28T12:00:00Z");

describe("parsePeriod", () => {
  it("accepte 7, 30 et 90", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod("90")).toBe(90);
  });

  it("retombe sur 30 pour toute autre valeur", () => {
    expect(parsePeriod("abc")).toBe(30);
    expect(parsePeriod(undefined)).toBe(30);
    expect(parsePeriod("365")).toBe(30);
    expect(parsePeriod(["7", "90"])).toBe(30);
  });
});

describe("periodRanges", () => {
  it("renvoie la période courante et la précédente, de même durée", () => {
    const { current, previous } = periodRanges(30, NOW);
    expect(current).toEqual({ start: new Date(NOW.getTime() - 30 * DAY), end: NOW });
    expect(previous).toEqual({
      start: new Date(NOW.getTime() - 60 * DAY),
      end: new Date(NOW.getTime() - 30 * DAY),
    });
  });
});

describe("delta", () => {
  it("calcule la variation relative", () => {
    expect(delta(120, 100)).toBeCloseTo(0.2);
  });

  it("renvoie null quand la période précédente vaut 0", () => {
    expect(delta(5, 0)).toBeNull();
  });
});

describe("buildCohortMatrix", () => {
  it("convertit les actifs en part de la cohorte et laisse null les semaines futures", () => {
    const rows = buildCohortMatrix(
      [
        { cohortWeek: "2026-10-19", size: 10, weekOffset: 0, active: 10 },
        { cohortWeek: "2026-10-19", size: 10, weekOffset: 1, active: 4 },
      ],
      NOW
    );
    expect(rows).toEqual([
      {
        cohortWeek: "2026-10-19",
        size: 10,
        cells: [1, 0.4, null, null, null, null, null, null, null],
      },
    ]);
  });

  it("met 0 pour une semaine écoulée sans actif", () => {
    const [row] = buildCohortMatrix(
      [{ cohortWeek: "2026-10-05", size: 4, weekOffset: 0, active: 4 }],
      NOW
    );
    expect(row.cells.slice(0, 4)).toEqual([1, 0, 0, 0]);
  });

  it("trie les cohortes de la plus récente à la plus ancienne", () => {
    const rows = buildCohortMatrix(
      [
        { cohortWeek: "2026-10-05", size: 1, weekOffset: 0, active: 1 },
        { cohortWeek: "2026-10-19", size: 1, weekOffset: 0, active: 1 },
      ],
      NOW
    );
    expect(rows.map((r) => r.cohortWeek)).toEqual(["2026-10-19", "2026-10-05"]);
  });
});

describe("fillDailySeries", () => {
  it("complète les jours manquants avec 0 pour chaque série", () => {
    const series = fillDailySeries(
      [{ day: "2026-10-27", signups: 3 }],
      { start: new Date("2026-10-26T12:00:00Z"), end: new Date("2026-10-28T12:00:00Z") },
      ["signups"]
    );
    expect(series).toEqual([
      { day: "2026-10-26", signups: 0 },
      { day: "2026-10-27", signups: 3 },
      { day: "2026-10-28", signups: 0 },
    ]);
  });
});

describe("monthToDateRanges", () => {
  it("compare le mois en cours au mois précédent sur la même durée", () => {
    const { current, previous } = monthToDateRanges(NOW);
    expect(current).toEqual({ start: new Date("2026-10-01T00:00:00Z"), end: NOW });
    expect(previous).toEqual({
      start: new Date("2026-09-01T00:00:00Z"),
      end: new Date("2026-09-28T12:00:00Z"),
    });
  });

  it("borne la période précédente à la fin du mois précédent", () => {
    const now = new Date("2026-03-31T12:00:00Z");
    const { previous } = monthToDateRanges(now);
    expect(previous).toEqual({
      start: new Date("2026-02-01T00:00:00Z"),
      end: new Date("2026-03-01T00:00:00Z"),
    });
  });
});

describe("splitComparisonSeries", () => {
  it("garde les N+1 derniers jours et y ajoute la valeur N jours avant en _prev", () => {
    const points = [
      { day: "2026-10-24", likes: 1 },
      { day: "2026-10-25", likes: 2 },
      { day: "2026-10-26", likes: 3 },
      { day: "2026-10-27", likes: 4 },
      { day: "2026-10-28", likes: 5 },
    ];
    expect(splitComparisonSeries(points, 2, ["likes"])).toEqual([
      { day: "2026-10-26", likes: 3, likes_prev: 1 },
      { day: "2026-10-27", likes: 4, likes_prev: 2 },
      { day: "2026-10-28", likes: 5, likes_prev: 3 },
    ]);
  });
});

describe("parsePlatform", () => {
  it("accepte ios et web, sinon all", () => {
    expect(parsePlatform("ios")).toBe("ios");
    expect(parsePlatform("web")).toBe("web");
    expect(parsePlatform("android")).toBe("all");
    expect(parsePlatform(undefined)).toBe("all");
  });
});
