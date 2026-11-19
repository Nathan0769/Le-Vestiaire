import { defaultLocale, isLocale, type Locale } from "@/i18n/locales";
import { parseAcceptLanguage } from "@/lib/request-locale";
import { SIGNUP_CONTEXT_HEADER, parseSignupContext } from "@/lib/signup-attribution";

/**
 * Langue d'un compte (`User.locale`), pour les e-mails envoyés hors requête.
 * Spec : docs/specs/2026-11-18-relances-traduites.md.
 * Toujours une langue de `i18n/locales.ts` : rien de ce qu'envoie le client n'est stocké tel quel.
 */

export function localeFromPath(path: string | null | undefined): Locale | null {
  const segment = path?.match(/^\/([a-z]{2})(?=\/|$)/)?.[1];
  return segment && isLocale(segment) ? segment : null;
}

function pathOfUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).pathname;
  } catch {
    return null;
  }
}

/**
 * Langue choisie à l'inscription : page d'où part l'inscription (email web),
 * puis page du Referer, puis Accept-Language (Google web, app iOS), puis français.
 */
export function signupLocale(input: {
  entryPath?: string | null;
  referer?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  return (
    localeFromPath(input.entryPath) ??
    localeFromPath(pathOfUrl(input.referer)) ??
    parseAcceptLanguage(input.acceptLanguage)
  );
}

/** Langue d'envoi d'un compte ; `null` ou valeur inconnue = français. */
export function accountLocale(stored: string | null | undefined): Locale {
  return stored && isLocale(stored) ? stored : defaultLocale;
}

/** Langue d'inscription lue dans les en-têtes de la requête de création du compte. */
export function signupLocaleFromHeaders(headers: Headers | null | undefined): Locale {
  return signupLocale({
    entryPath: parseSignupContext(headers?.get(SIGNUP_CONTEXT_HEADER)).entryPath,
    referer: headers?.get("referer"),
    acceptLanguage: headers?.get("accept-language"),
  });
}
