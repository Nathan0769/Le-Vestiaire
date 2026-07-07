import type { SimpleJersey } from "@/types/jersey";

export type BrandSegment = {
  brand: string;
  startSeason: string;
  endSeason: string;
};

export type ClubStats = {
  totalJerseys: number;
  seasonRange: { start: string; end: string } | null;
  uniqueBrands: string[];
  currentBrand: string | null;
  brandTimeline: BrandSegment[];
  avgRating: number;
  totalRatings: number;
  favoriteCount: number;
  typeCounts: Record<string, number>;
};

function pickRepresentativeBrand(jerseys: SimpleJersey[]): string | null {
  const home = jerseys.find((j) => j.type === "HOME");
  return (home ?? jerseys[0])?.brand ?? null;
}

export function computeClubStats(
  jerseys: SimpleJersey[],
  ratingAggregate: { avg: number; count: number },
  favoriteCount: number
): ClubStats {
  const totalJerseys = jerseys.length;

  const seasonsAsc = [...new Set(jerseys.map((j) => j.season))].sort((a, b) =>
    a.localeCompare(b)
  );

  const seasonRange =
    seasonsAsc.length > 0
      ? { start: seasonsAsc[0], end: seasonsAsc[seasonsAsc.length - 1] }
      : null;

  const uniqueBrands = [
    ...new Set(jerseys.map((j) => j.brand).filter((b) => b && b !== "Inconnu")),
  ];

  const jerseysBySeason = jerseys.reduce<Record<string, SimpleJersey[]>>(
    (acc, j) => {
      (acc[j.season] ??= []).push(j);
      return acc;
    },
    {}
  );

  const seasonBrandPairs = seasonsAsc
    .map((season) => ({
      season,
      brand: pickRepresentativeBrand(jerseysBySeason[season] ?? []),
    }))
    .filter((p): p is { season: string; brand: string } => p.brand !== null);

  const brandTimeline: BrandSegment[] = [];
  for (const { season, brand } of seasonBrandPairs) {
    const last = brandTimeline[brandTimeline.length - 1];
    if (last && last.brand === brand) {
      last.endSeason = season;
    } else {
      brandTimeline.push({ brand, startSeason: season, endSeason: season });
    }
  }

  const currentBrand =
    seasonBrandPairs[seasonBrandPairs.length - 1]?.brand ?? null;

  const typeCounts = jerseys.reduce<Record<string, number>>((acc, j) => {
    acc[j.type] = (acc[j.type] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalJerseys,
    seasonRange,
    uniqueBrands,
    currentBrand,
    brandTimeline,
    avgRating: ratingAggregate.avg,
    totalRatings: ratingAggregate.count,
    favoriteCount,
    typeCounts,
  };
}
