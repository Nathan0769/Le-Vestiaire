export interface ResolvedI18n {
  i18nKey: string;
  params: Record<string, string | number>;
}

export function resolveAchievementI18n(
  key: string,
  metadata?: Record<string, unknown> | null,
): ResolvedI18n {
  const monthMatch = key.match(/^(.+)\.(\d{4}-\d{2})$/);
  if (monthMatch) {
    const base = monthMatch[1];
    const month = monthMatch[2];
    const rank =
      metadata && typeof metadata.rank === "number"
        ? (metadata.rank as number)
        : undefined;
    return {
      i18nKey: `achievements.definitions.${base}`,
      params: rank !== undefined ? { month, rank } : { month },
    };
  }
  return {
    i18nKey: `achievements.definitions.${key}`,
    params: {},
  };
}
