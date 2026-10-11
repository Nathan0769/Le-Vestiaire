/** Langues supportées. Fichier sans dépendance, importable depuis `lib/` et les routes API. */
export const locales = ["fr", "en", "es", "de", "pt", "nl", "it"] as const;

export const defaultLocale = "fr" as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
