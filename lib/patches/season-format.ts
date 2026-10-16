import type { PatchFamily } from "@prisma/client";
import { isCalendarYearLeague } from "./calendar-year-leagues";

const YEAR_REGEX = /^\d{4}$/;
export const SEASON_REGEX = /^\d{4}-\d{2}$/;
const YEAR_OR_SEASON_REGEX = /^\d{4}(-\d{2})?$/;

// Ligues passées de l'année civile à la saison à cheval (J1 en 2026-27) :
// leurs versions de patch peuvent être dans l'un ou l'autre format.
const MIXED_SEASON_FORMAT_LEAGUE_IDS = new Set(["j1-league"]);

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function isYearFormat(
  family: PatchFamily,
  leagueId: string | null
): boolean {
  return family === "NATIONAL_TEAM_COMPETITION" || isCalendarYearLeague(leagueId);
}

export type PatchPeriodFormat = {
  regex: RegExp;
  label: string;
  useYear: boolean;
};

export function getPatchPeriodFormat(
  family: PatchFamily,
  leagueId: string | null
): PatchPeriodFormat {
  if (leagueId && MIXED_SEASON_FORMAT_LEAGUE_IDS.has(leagueId)) {
    return { regex: YEAR_OR_SEASON_REGEX, label: "YYYY ou YYYY-YY", useYear: true };
  }
  return isYearFormat(family, leagueId)
    ? { regex: YEAR_REGEX, label: "YYYY", useYear: true }
    : { regex: SEASON_REGEX, label: "YYYY-YY", useYear: false };
}

export function validatePatchVersionPeriod(
  family: PatchFamily,
  leagueId: string | null,
  start: string,
  end: string | null
): ValidationResult {
  const { regex, label: formatLabel } = getPatchPeriodFormat(family, leagueId);

  if (!regex.test(start)) {
    return {
      valid: false,
      error: `Format début invalide (attendu ${formatLabel})`,
    };
  }

  if (end !== null) {
    if (!regex.test(end)) {
      return {
        valid: false,
        error: `Format fin invalide (attendu ${formatLabel})`,
      };
    }
    if (end < start) {
      return {
        valid: false,
        error: "La fin doit être postérieure ou égale au début",
      };
    }
  }

  return { valid: true };
}

export function isJerseySeasonInPatchPeriod(
  jerseySeason: string,
  start: string,
  end: string | null
): boolean {
  const afterStart = start <= jerseySeason;
  const beforeEnd = end === null || end >= jerseySeason;
  return afterStart && beforeEnd;
}
