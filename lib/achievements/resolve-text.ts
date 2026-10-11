import { defaultLocale, type Locale } from "@/i18n/locales";
import { resolveAchievementI18n } from "./render";
import { getBadgeUrl } from "./badge-url";

type Json = Record<string, unknown>;

export interface AchievementText {
  title: string;
  description: string;
  howTo: string | null;
  badgeUrl: string | null;
}

export type AchievementTextResolver = (
  key: string,
  metadata?: Record<string, unknown> | null,
) => AchievementText;

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Json)[k];
    return undefined;
  }, obj);
}

function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`,
  );
}

const messagesCache = new Map<Locale, Promise<Json>>();

function loadMessages(locale: Locale): Promise<Json> {
  let messages = messagesCache.get(locale);
  if (!messages) {
    messages = import(`@/messages/${locale}.json`).then(
      (m) => m.default as Json,
    );
    messagesCache.set(locale, messages);
  }
  return messages;
}

/**
 * Prépare la résolution du titre + description d'un succès dans une langue,
 * pour l'app mobile (le web résout ces textes côté client, par locale, et
 * ignore ces champs). Les messages sont chargés une fois par langue.
 */
export async function getAchievementTextResolver(
  locale: Locale = defaultLocale,
): Promise<AchievementTextResolver> {
  const messages = await loadMessages(locale);

  return (key, metadata) => {
    const { i18nKey, params } = resolveAchievementI18n(key, metadata, locale);
    const node = getNested(messages, i18nKey) as Json | undefined;
    const rawTitle = typeof node?.title === "string" ? node.title : key;
    const rawDesc =
      typeof node?.description === "string" ? node.description : "";
    const rawHowTo = typeof node?.howTo === "string" ? node.howTo : null;
    return {
      title: interpolate(rawTitle, params),
      description: interpolate(rawDesc, params),
      howTo: rawHowTo ? interpolate(rawHowTo, params) : null,
      badgeUrl: getBadgeUrl(key),
    };
  };
}
