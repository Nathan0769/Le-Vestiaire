import { locales } from "@/i18n/locales";

/**
 * Source d'une inscription : normalisation de ce que le client envoie et
 * classement pour le dashboard KPI. Spec : docs/specs/2026-11-18-source-inscription.md.
 *
 * Tout ce qui arrive du client est non fiable : bornes et listes blanches,
 * et on ne garde que le minimum (chemin sans query, hôte du référent).
 */

/** En-tête du contexte d'inscription email (le client web l'envoie, le hook le lit). */
export const SIGNUP_CONTEXT_HEADER = "x-signup-context";

export type SignupPlatform = "web" | "ios";
export type SignupMethod = "email" | "google" | "apple" | "other";

export type SignupContext = {
  entryPath?: string;
  referrer?: string;
  ref?: string;
  firstPath?: string;
  platform?: SignupPlatform;
};

export type SignupAttributionData = {
  platform: SignupPlatform;
  method: SignupMethod;
  entryPath: string | null;
  referrerHost: string | null;
  ref: string | null;
  firstPath: string | null;
};

const MAX_CONTEXT_BYTES = 2048;
const MAX_PATH_LENGTH = 200;
const MAX_FIELD_LENGTH = 1000;
const TEXT_FIELDS = ["entryPath", "referrer", "ref", "firstPath"] as const;
const REF_PATTERN = /^[a-z0-9_:-]{1,64}$/;
const LOCALE_PREFIX = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

/**
 * Valeur de l'en-tête `x-signup-context`. Encodée : un navigateur refuse un
 * en-tête hors ISO-8859-1 (« œ », « ’ », emoji) et fetch échouait, sans compte créé.
 */
export function encodeSignupContextHeader(context: SignupContext): string {
  return encodeURIComponent(JSON.stringify(context));
}

/** Accepte la chaîne d'un en-tête ou l'objet de l'état OAuth ; tout écart donne `{}`. */
export function parseSignupContext(raw: unknown): SignupContext {
  let value: unknown = raw;
  if (typeof raw === "string") {
    if (raw.length > MAX_CONTEXT_BYTES * 3) return {};
    try {
      // JSON brut accepté aussi : pages chargées avant le passage à l'encodage
      const text = raw.startsWith("{") ? raw : decodeURIComponent(raw);
      if (text.length > MAX_CONTEXT_BYTES) return {};
      value = JSON.parse(text);
    } catch {
      return {};
    }
  } else if (raw && typeof raw === "object") {
    if (JSON.stringify(raw).length > MAX_CONTEXT_BYTES) return {};
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const input = value as Record<string, unknown>;
  const context: SignupContext = {};
  for (const field of TEXT_FIELDS) {
    const v = input[field];
    if (typeof v === "string" && v.length > 0 && v.length <= MAX_FIELD_LENGTH) context[field] = v;
  }
  if (input.platform === "ios" || input.platform === "web") context.platform = input.platform;
  return context;
}

/** Chemin interne seul : sans query ni fragment (jetons, e-mails), sans préfixe de langue. */
export function normalizePath(raw: string | undefined | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0].replace(LOCALE_PREFIX, "") || "/";
  return path.slice(0, MAX_PATH_LENGTH);
}

/** Hôte du référent, `null` s'il est absent, invalide ou interne au site. */
export function referrerHost(raw: string | undefined | null, siteHost: string): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const site = siteHost.toLowerCase().replace(/^www\./, "");
  if (host === site || host.endsWith(`.${site}`)) return null;
  return host;
}

export function normalizeRef(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const ref = raw.toLowerCase();
  return REF_PATTERN.test(ref) ? ref : null;
}

/**
 * L'app envoie `Origin: levestiaire://app` et `X-App-Version` à chaque appel ;
 * l'ancien parcours `mobile-login` (navigateur) se déclare dans le contexte.
 * Forgeable, sans conséquence : c'est une statistique.
 */
export function detectPlatform(headers: Headers | null | undefined, context: SignupContext): SignupPlatform {
  if (context.platform === "ios") return "ios";
  if (headers?.get("origin")?.startsWith("levestiaire://")) return "ios";
  if (headers?.get("x-app-version")) return "ios";
  return "web";
}

export function detectMethod(path: string | undefined | null, provider: string | null): SignupMethod {
  if (path === "/sign-up/email") return "email";
  if (path?.startsWith("/callback/") || path === "/sign-in/social") {
    if (provider === "google" || provider === "apple") return provider;
  }
  return "other";
}

export function buildSignupAttribution(input: {
  headers: Headers | null | undefined;
  path: string | undefined | null;
  provider: string | null;
  context: SignupContext;
  siteHost: string;
}): SignupAttributionData {
  const { context } = input;
  return {
    platform: detectPlatform(input.headers, context),
    method: detectMethod(input.path, input.provider),
    entryPath: normalizePath(context.entryPath),
    referrerHost: referrerHost(context.referrer, input.siteHost),
    ref: normalizeRef(context.ref),
    firstPath: normalizePath(context.firstPath),
  };
}

// ---------------------------------------------------------------------------
// Classement à la lecture (changer une règle ne demande pas de migration)

const SEARCH_HOSTS = /(^|\.)(google|bing|qwant|duckduckgo|ecosia|yahoo|yandex|brave|startpage|ask)\.[a-z.]+$/;
const SOCIAL_HOSTS =
  /(^|\.)(instagram\.com|facebook\.com|fb\.com|t\.co|x\.com|twitter\.com|tiktok\.com|reddit\.com|youtube\.com|youtu\.be|whatsapp\.com|snapchat\.com|threads\.net|linkedin\.com|lnkd\.in|pinterest\.[a-z.]+)$/;

export type SourceRow = {
  hasAttribution: boolean;
  platform: string | null;
  referrerHost: string | null;
  ref: string | null;
};

export function classifyChannel(row: SourceRow): string {
  if (!row.hasAttribution) return "unknown";
  if (row.ref) return `ref:${row.ref}`;
  const host = row.referrerHost;
  if (host) {
    if (SEARCH_HOSTS.test(host)) return "search";
    if (SOCIAL_HOSTS.test(host)) return "social";
    return "other_site";
  }
  return row.platform === "ios" ? "app" : "direct";
}

export type PageKind =
  | "jersey"
  | "club"
  | "catalog"
  | "home"
  | "profile"
  | "shared_wishlist"
  | "auth"
  | "other"
  | "none";

export function classifyPage(path: string | null): PageKind {
  if (!path) return "none";
  if (path === "/") return "home";
  if (/^\/jerseys\/[^/]+\/clubs\/[^/]+\/jerseys\/[^/]+/.test(path)) return "jersey";
  if (/^\/jerseys\/[^/]+\/clubs\/[^/]+\/?$/.test(path)) return "club";
  if (path === "/jerseys" || path.startsWith("/jerseys/")) return "catalog";
  if (path.startsWith("/u/") || path.startsWith("/users/")) return "profile";
  if (path.startsWith("/w/")) return "shared_wishlist";
  if (path.startsWith("/auth")) return "auth";
  return "other";
}

export type SummaryRow = SourceRow & { entryPath: string | null; firstPath: string | null };
export type CountEntry = { key: string; count: number };
export type SignupSourcesSummary = {
  total: number;
  channels: CountEntry[];
  pages: CountEntry[];
  topPaths: CountEntry[];
};

const TOP_PATHS = 10;

function sortedCounts(keys: string[]): CountEntry[] {
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  // Tri stable : à égalité, l'ordre d'apparition est conservé
  return [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/**
 * Répartition des inscriptions. La page d'arrivée retenue est la première page
 * vue (connue seulement avec consentement), sinon la page d'où part l'inscription.
 */
export function summarizeSignupSources(rows: SummaryRow[]): SignupSourcesSummary {
  const landings = rows
    .map((r) => r.firstPath ?? r.entryPath)
    .filter((p): p is string => p !== null);
  return {
    total: rows.length,
    channels: sortedCounts(rows.map(classifyChannel)),
    pages: sortedCounts(landings.map(classifyPage)),
    topPaths: sortedCounts(landings).slice(0, TOP_PATHS),
  };
}
