import { describe, it, expect } from "vitest";
import { ACHIEVEMENTS, effectiveTier } from "@/lib/achievements/definitions";
import { pickTopAchievements } from "@/lib/achievements/top-achievements";

const at = (iso: string) => new Date(iso);

describe("palier LEGEND", () => {
  it("Fondateur et Membre du Cercle sont définis en LEGEND", () => {
    expect(ACHIEVEMENTS["special.founder"].tier).toBe("LEGEND");
    expect(ACHIEVEMENTS["loyalty.supporter"].tier).toBe("LEGEND");
  });

  it("effectiveTier préfère la définition au palier stocké en base", () => {
    expect(effectiveTier("special.founder", "PLATINUM")).toBe("LEGEND");
    expect(effectiveTier("loyalty.supporter", "PLATINUM")).toBe("LEGEND");
    expect(effectiveTier("collection.100", "PLATINUM")).toBe("PLATINUM");
  });

  it("effectiveTier garde le palier stocké pour une clé hors définitions", () => {
    expect(effectiveTier("leaderboard.monthly.top3.2026-07", "GOLD")).toBe("GOLD");
    expect(effectiveTier("leaderboard.monthly.top3.2026-07", null)).toBeNull();
  });

  it("pickTopAchievements classe LEGEND devant PLATINUM, même stocké PLATINUM", () => {
    const top = pickTopAchievements(
      [
        { key: "collection.500", tier: "PLATINUM", unlockedAt: at("2026-09-01") },
        { key: "special.founder", tier: "PLATINUM", unlockedAt: at("2025-01-01") },
        { key: "loyalty.supporter", tier: "PLATINUM", unlockedAt: at("2025-06-01") },
      ],
      3,
    );
    expect(top.map((a) => a.key)).toEqual([
      "loyalty.supporter",
      "special.founder",
      "collection.500",
    ]);
    expect(top[0].tier).toBe("LEGEND");
    expect(top[2].tier).toBe("PLATINUM");
  });
});
