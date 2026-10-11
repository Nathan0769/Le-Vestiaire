import { defaultLocale, isLocale, type Locale } from "@/i18n/locales";

/**
 * Choisit la langue de réponse à partir d'un en-tête `Accept-Language`.
 * Retourne toujours une langue de la liste supportée : la valeur de l'en-tête
 * n'est jamais réutilisée telle quelle (pas de chemin ni de requête construits
 * avec). Sans en-tête, ou sans langue supportée, c'est le français.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;

  const candidates = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        language: tag.trim().toLowerCase().split("-")[0],
        // Un poids illisible vaut 1, comme s'il était absent.
        q: Number.isFinite(q) ? q : 1,
        index,
      };
    })
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { language } of candidates) {
    if (isLocale(language)) return language;
  }
  return defaultLocale;
}

/** Langue dans laquelle répondre à une requête API (app mobile). */
export function getRequestLocale(request: Request): Locale {
  return parseAcceptLanguage(request.headers.get("accept-language"));
}
