export const MAX_PINS = 3;

export function canPin(currentPinnedCount: number): boolean {
  return currentPinnedCount < MAX_PINS;
}

export function comparePinnedFirst(
  aPinnedAt: Date | string | null | undefined,
  bPinnedAt: Date | string | null | undefined
): number {
  const aPinned = aPinnedAt != null;
  const bPinned = bPinnedAt != null;
  if (aPinned && !bPinned) return -1;
  if (!aPinned && bPinned) return 1;
  if (aPinned && bPinned) {
    const aTime = new Date(aPinnedAt as Date | string).getTime();
    const bTime = new Date(bPinnedAt as Date | string).getTime();
    return bTime - aTime;
  }
  return 0;
}
