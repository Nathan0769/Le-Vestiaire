import { describe, it, expect } from "vitest";
import { ACHIEVEMENTS, ACHIEVEMENT_TRIGGERS } from "@/lib/achievements/definitions";

describe("ACHIEVEMENTS catalogue", () => {
  const entries = Object.entries(ACHIEVEMENTS);

  it("toutes les clés sont uniques", () => {
    const keys = entries.map(([k]) => k);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("chaque définition a une catégorie valide", () => {
    const valid = ["COLLECTION", "DIVERSITY", "SOCIAL", "LEADERBOARD", "LOYALTY", "RARITY", "CONTRIBUTION"];
    for (const [key, def] of entries) {
      expect(valid, `${key}`).toContain(def.category);
    }
  });

  it("chaque définition a au moins un trigger valide", () => {
    for (const [key, def] of entries) {
      expect(def.triggers.length, `${key} triggers`).toBeGreaterThan(0);
      for (const trigger of def.triggers) {
        expect(ACHIEVEMENT_TRIGGERS, `${key} trigger ${trigger}`).toContain(trigger);
      }
    }
  });

  it("chaque tier optionnel est valide", () => {
    const validTiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
    for (const [key, def] of entries) {
      if (def.tier) expect(validTiers, `${key} tier`).toContain(def.tier);
    }
  });

  it("chaque def a un threshold > 0", () => {
    for (const [key, def] of entries) {
      expect(def.threshold, `${key}`).toBeGreaterThan(0);
    }
  });

  it("chaque def a un i18nKey non vide", () => {
    for (const [key, def] of entries) {
      expect(def.i18nKey, `${key}`).toBeTruthy();
      expect(def.i18nKey.length, `${key}`).toBeGreaterThan(0);
    }
  });

  it("chaque def a une fonction computeProgress", () => {
    for (const [key, def] of entries) {
      expect(typeof def.computeProgress, `${key}`).toBe("function");
    }
  });

  it("le catalogue contient au moins 15 succès pour démarrer", () => {
    expect(entries.length).toBeGreaterThanOrEqual(15);
  });
});
