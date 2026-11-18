import { isValidReturnTo } from "@/lib/auth-gate";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";
import type { SignupContext } from "@/lib/signup-attribution";

/**
 * Contexte d'inscription envoyé par le navigateur au moment de s'inscrire.
 * Rien n'est stocké à l'avance sans consentement (spec 2026-11-18) : page en
 * cours, `document.referrer` (avec la navigation client, celui du chargement
 * initial) et `?ref=`. La première page vue n'existe qu'avec l'accord mesure
 * d'audience, en sessionStorage.
 */

const FIRST_PATH_KEY = "lv_first_path";

export function buildSignupContext(input: {
  pathname: string;
  search: string;
  referrer: string;
  returnTo: string | null | undefined;
  firstPath: string | null;
}): SignupContext {
  const returnTo = isValidReturnTo(input.returnTo) ? input.returnTo : null;
  const ref =
    new URLSearchParams(input.search).get("ref") ??
    (returnTo ? new URLSearchParams(returnTo.split("?")[1] ?? "").get("ref") : null);

  const context: SignupContext = { entryPath: returnTo ?? input.pathname };
  if (input.referrer) context.referrer = input.referrer;
  if (ref) context.ref = ref;
  if (input.firstPath) context.firstPath = input.firstPath;
  return context;
}

function readFirstPath(): string | null {
  if (!hasAnalyticsConsent()) return null;
  try {
    return sessionStorage.getItem(FIRST_PATH_KEY);
  } catch {
    return null;
  }
}

/** Contexte courant du navigateur ; `{}` côté serveur. */
export function currentSignupContext(returnTo?: string | null): SignupContext {
  if (typeof window === "undefined") return {};
  return buildSignupContext({
    pathname: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    returnTo,
    firstPath: readFirstPath(),
  });
}

/**
 * Note la première page vue de l'onglet, seulement avec le consentement mesure
 * d'audience. Appelé au chargement et au moment où le visiteur accepte.
 */
export function rememberFirstPath(): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  try {
    if (!sessionStorage.getItem(FIRST_PATH_KEY)) {
      sessionStorage.setItem(FIRST_PATH_KEY, window.location.pathname);
    }
  } catch {
    // sessionStorage indisponible (navigation privée stricte) : on s'en passe
  }
}
