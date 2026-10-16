import { describe, it, expect } from "vitest";
import { isCalendarYearLeague } from "./calendar-year-leagues";

describe("isCalendarYearLeague", () => {
  it("retourne true pour la MLS", () => {
    expect(isCalendarYearLeague("mls")).toBe(true);
  });

  it("retourne false pour une ligue en saison YYYY-YY", () => {
    expect(isCalendarYearLeague("ligue-1")).toBe(false);
  });

  it("retourne false sans ligue", () => {
    expect(isCalendarYearLeague(null)).toBe(false);
  });
});
