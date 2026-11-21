import { describe, it, expect } from "vitest";
import { recalcNoticeDate } from "./recalc-notice";

describe("recalcNoticeDate", () => {
  const recalc = "2026-11-24";
  it("rien avant le recalcul ni sans date", () => {
    expect(recalcNoticeDate(null, new Date("2026-11-25"))).toBeNull();
    expect(recalcNoticeDate(recalc, new Date("2026-11-23T12:00:00Z"))).toBeNull();
  });
  it("affichée pendant 30 jours", () => {
    expect(recalcNoticeDate(recalc, new Date("2026-11-24T08:00:00Z"))).toEqual(new Date("2026-11-24T00:00:00Z"));
    expect(recalcNoticeDate(recalc, new Date("2026-12-23T12:00:00Z"))).not.toBeNull();
    expect(recalcNoticeDate(recalc, new Date("2026-12-25T00:00:00Z"))).toBeNull();
  });
});
