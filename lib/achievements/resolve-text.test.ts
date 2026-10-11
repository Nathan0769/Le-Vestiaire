import { describe, it, expect } from "vitest";
import { getAchievementTextResolver } from "./resolve-text";

describe("getAchievementTextResolver", () => {
  it("résout le texte en français", async () => {
    const resolve = await getAchievementTextResolver("fr");
    expect(resolve("collection.3").title).toBe("Les débuts");
  });

  it("résout le texte dans la langue demandée", async () => {
    const resolve = await getAchievementTextResolver("en");
    const text = resolve("collection.3");
    expect(text.title).toBe("The beginning");
    expect(text.description).toBe("3 jerseys");
    expect(text.howTo).toBe("Reach 3 jerseys in your collection.");
  });

  it("interpole le mois dans la langue demandée", async () => {
    const resolve = await getAchievementTextResolver("en");
    const text = resolve("leaderboard.monthly_top3.collection_size.2026-07", {
      rank: 2,
    });
    expect(text.title).toBe("Collector of the Month · July 2026");
    expect(text.description).toBe("Top 2 additions of the month");
  });

  it("retombe sur la clé quand le succès est inconnu", async () => {
    const resolve = await getAchievementTextResolver("de");
    expect(resolve("inconnu.cle").title).toBe("inconnu.cle");
  });
});
