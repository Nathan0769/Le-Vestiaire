export interface ResolvedI18n {
  i18nKey: string;
  params: Record<string, string | number>;
}

/** Formate "2026-07" en libellé de mois localisé (ex: "juillet 2026"). */
function formatMonthLabel(raw: string, locale: string): string {
  const [year, month] = raw.split("-").map(Number);
  if (!year || !month) return raw;
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function resolveAchievementI18n(
  key: string,
  metadata?: Record<string, unknown> | null,
  locale = "fr",
): ResolvedI18n {
  const monthMatch = key.match(/^(.+)\.(\d{4}-\d{2})$/);
  if (monthMatch) {
    const base = monthMatch[1];
    const month = formatMonthLabel(monthMatch[2], locale);
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
