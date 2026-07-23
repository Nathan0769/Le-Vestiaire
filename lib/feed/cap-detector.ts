import type { CapKind } from "@prisma/client";

export const COLLECTION_CAPS = [50, 100, 500, 1000] as const;
export const VALUE_CAPS = [1000, 5000, 25000] as const;

const COLLECTION_CAP_MAP: Record<(typeof COLLECTION_CAPS)[number], CapKind> = {
  50: "COLLECTION_50",
  100: "COLLECTION_100",
  500: "COLLECTION_500",
  1000: "COLLECTION_1000",
};

const VALUE_CAP_MAP: Record<(typeof VALUE_CAPS)[number], CapKind> = {
  1000: "VALUE_1K",
  5000: "VALUE_5K",
  25000: "VALUE_25K",
};

/**
 * Retourne le cap collection franchi (max) entre countBefore et countAfter, ou null.
 * Franchi = countBefore < cap <= countAfter.
 */
export function detectCollectionCap(
  countBefore: number,
  countAfter: number
): CapKind | null {
  let highest: CapKind | null = null;
  for (const threshold of COLLECTION_CAPS) {
    if (countBefore < threshold && countAfter >= threshold) {
      highest = COLLECTION_CAP_MAP[threshold];
    }
  }
  return highest;
}

/**
 * Retourne le cap valeur cumulée franchi (max), ou null.
 */
export function detectValueCap(
  valueBefore: number,
  valueAfter: number
): CapKind | null {
  let highest: CapKind | null = null;
  for (const threshold of VALUE_CAPS) {
    if (valueBefore < threshold && valueAfter >= threshold) {
      highest = VALUE_CAP_MAP[threshold];
    }
  }
  return highest;
}
