import type { PatchFamily } from "@prisma/client";

const YEAR_REGEX = /^\d{4}$/;
export const SEASON_REGEX = /^\d{4}-\d{2}$/;

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function isYearFormat(family: PatchFamily): boolean {
  return family === "NATIONAL_TEAM_COMPETITION";
}

export function validatePatchVersionPeriod(
  family: PatchFamily,
  start: string,
  end: string | null
): ValidationResult {
  const useYear = isYearFormat(family);
  const regex = useYear ? YEAR_REGEX : SEASON_REGEX;
  const formatLabel = useYear ? "YYYY" : "YYYY-YY";

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
