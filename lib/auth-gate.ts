import { normalizeRef } from "@/lib/signup-attribution";

export const AUTH_GATE_INTENTS = ["add_collection", "add_wishlist", "report"] as const;
export type AuthGateIntent = (typeof AUTH_GATE_INTENTS)[number];

const INTENT_SET = new Set<string>(AUTH_GATE_INTENTS);

export function isValidReturnTo(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("://")) return false;
  return true;
}

export function buildReturnTo(currentPath: string, intent: AuthGateIntent): string {
  const [path, search = ""] = currentPath.split("?");
  const params = new URLSearchParams(search);
  params.set("intent", intent);
  return `${path}?${params.toString()}`;
}

/**
 * Garde le `?ref=` de nos liens (parrainage, récap, wishlist partagée) dans
 * `returnTo`, pour qu'il survive au parcours d'inscription, OAuth compris.
 */
export function withRef(returnTo: string, currentSearch: string): string {
  const ref = normalizeRef(new URLSearchParams(currentSearch).get("ref"));
  if (!ref) return returnTo;
  const [path, search = ""] = returnTo.split("?");
  const params = new URLSearchParams(search);
  if (params.has("ref")) return returnTo;
  params.set("ref", ref);
  return `${path}?${params.toString()}`;
}

export function buildAuthUrl(authPage: "login" | "signUp", returnTo: string): string {
  return `/auth/${authPage}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function parsePendingIntent(searchParams: URLSearchParams): AuthGateIntent | null {
  const raw = searchParams.get("intent");
  if (!raw) return null;
  return INTENT_SET.has(raw) ? (raw as AuthGateIntent) : null;
}
