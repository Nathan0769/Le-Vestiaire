export interface TopJerseyInput {
  id: string;
  pinnedAt: Date | null;
  createdAt: Date;
  userRating: number | null;
}

export function selectTopJerseys<T extends TopJerseyInput>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => {
    if (a.pinnedAt && b.pinnedAt) {
      return b.pinnedAt.getTime() - a.pinnedAt.getTime();
    }
    if (a.pinnedAt) return -1;
    if (b.pinnedAt) return 1;

    if (a.userRating !== null && b.userRating !== null) {
      return b.userRating - a.userRating;
    }
    if (a.userRating !== null) return -1;
    if (b.userRating !== null) return 1;

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return sorted.slice(0, 6);
}
