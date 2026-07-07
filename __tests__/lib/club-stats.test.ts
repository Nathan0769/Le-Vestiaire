import { describe, it, expect } from "vitest";
import { computeClubStats } from "@/lib/club-stats";
import type { SimpleJersey } from "@/types/jersey";

function jersey(
  overrides: Partial<SimpleJersey> & Pick<SimpleJersey, "season" | "type" | "brand">
): SimpleJersey {
  return {
    id: `j-${Math.random()}`,
    name: `Maillot ${overrides.type} ${overrides.season}`,
    imageUrl: "https://example.com/img.jpg",
    clubId: "club-1",
    variant: 1,
    slug: null,
    description: null,
    ...overrides,
  } as unknown as SimpleJersey;
}

describe("computeClubStats", () => {
  it("retourne des valeurs vides quand aucun maillot", () => {
    const stats = computeClubStats([], { avg: 0, count: 0 }, 0);

    expect(stats.totalJerseys).toBe(0);
    expect(stats.seasonRange).toBeNull();
    expect(stats.uniqueBrands).toEqual([]);
    expect(stats.currentBrand).toBeNull();
    expect(stats.brandTimeline).toEqual([]);
    expect(stats.avgRating).toBe(0);
    expect(stats.favoriteCount).toBe(0);
    expect(stats.typeCounts).toEqual({});
  });

  it("calcule le range de saisons min/max", () => {
    const jerseys = [
      jersey({ season: "2020-2021", type: "HOME", brand: "Nike" }),
      jersey({ season: "2018-2019", type: "HOME", brand: "Nike" }),
      jersey({ season: "2024-2025", type: "HOME", brand: "Adidas" }),
    ];

    const stats = computeClubStats(jerseys, { avg: 0, count: 0 }, 0);

    expect(stats.seasonRange).toEqual({ start: "2018-2019", end: "2024-2025" });
  });

  it("regroupe les saisons consecutives par marque en segments", () => {
    const jerseys = [
      jersey({ season: "2020-2021", type: "HOME", brand: "Nike" }),
      jersey({ season: "2021-2022", type: "HOME", brand: "Nike" }),
      jersey({ season: "2022-2023", type: "HOME", brand: "Adidas" }),
      jersey({ season: "2023-2024", type: "HOME", brand: "Adidas" }),
      jersey({ season: "2024-2025", type: "HOME", brand: "Puma" }),
    ];

    const stats = computeClubStats(jerseys, { avg: 0, count: 0 }, 0);

    expect(stats.brandTimeline).toEqual([
      { brand: "Nike", startSeason: "2020-2021", endSeason: "2021-2022" },
      { brand: "Adidas", startSeason: "2022-2023", endSeason: "2023-2024" },
      { brand: "Puma", startSeason: "2024-2025", endSeason: "2024-2025" },
    ]);
  });

  it("choisit la marque du maillot HOME quand plusieurs types coexistent", () => {
    const jerseys = [
      jersey({ season: "2024-2025", type: "AWAY", brand: "Kappa" }),
      jersey({ season: "2024-2025", type: "HOME", brand: "Adidas" }),
      jersey({ season: "2024-2025", type: "GOALKEEPER", brand: "Uhlsport" }),
    ];

    const stats = computeClubStats(jerseys, { avg: 0, count: 0 }, 0);

    expect(stats.currentBrand).toBe("Adidas");
    expect(stats.brandTimeline).toHaveLength(1);
    expect(stats.brandTimeline[0].brand).toBe("Adidas");
  });

  it("expose la marque actuelle depuis la saison la plus recente", () => {
    const jerseys = [
      jersey({ season: "2020-2021", type: "HOME", brand: "Nike" }),
      jersey({ season: "2024-2025", type: "HOME", brand: "Puma" }),
    ];

    const stats = computeClubStats(jerseys, { avg: 0, count: 0 }, 0);

    expect(stats.currentBrand).toBe("Puma");
  });

  it("filtre les marques 'Inconnu' du set uniqueBrands", () => {
    const jerseys = [
      jersey({ season: "2020-2021", type: "HOME", brand: "Nike" }),
      jersey({ season: "2021-2022", type: "HOME", brand: "Inconnu" }),
      jersey({ season: "2022-2023", type: "HOME", brand: "Adidas" }),
    ];

    const stats = computeClubStats(jerseys, { avg: 0, count: 0 }, 0);

    expect(stats.uniqueBrands).toEqual(["Nike", "Adidas"]);
  });

  it("compte les maillots par type", () => {
    const jerseys = [
      jersey({ season: "2024-2025", type: "HOME", brand: "Nike" }),
      jersey({ season: "2024-2025", type: "HOME", brand: "Nike", variant: 2 }),
      jersey({ season: "2024-2025", type: "AWAY", brand: "Nike" }),
      jersey({ season: "2024-2025", type: "GOALKEEPER", brand: "Nike" }),
      jersey({ season: "2024-2025", type: "GOALKEEPER", brand: "Nike", variant: 2 }),
      jersey({ season: "2024-2025", type: "GOALKEEPER", brand: "Nike", variant: 3 }),
    ];

    const stats = computeClubStats(jerseys, { avg: 0, count: 0 }, 0);

    expect(stats.typeCounts).toEqual({
      HOME: 2,
      AWAY: 1,
      GOALKEEPER: 3,
    });
    expect(stats.totalJerseys).toBe(6);
  });

  it("propage rating aggregate et favorite count", () => {
    const jerseys = [jersey({ season: "2024-2025", type: "HOME", brand: "Nike" })];

    const stats = computeClubStats(jerseys, { avg: 4.2, count: 15 }, 42);

    expect(stats.avgRating).toBe(4.2);
    expect(stats.totalRatings).toBe(15);
    expect(stats.favoriteCount).toBe(42);
  });
});
