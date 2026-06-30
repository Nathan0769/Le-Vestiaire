import type { AuthGateIntent } from "./auth-gate";

export type AnalyticsEvent =
  | { name: "auth_gate_opened"; params: { intent: AuthGateIntent; jersey_id: string } }
  | { name: "auth_gate_signup_clicked"; params: { intent: AuthGateIntent; provider: "google" | "email" } }
  | { name: "auth_gate_login_clicked"; params: { intent: AuthGateIntent } }
  | { name: "auth_gate_dismissed"; params: { intent: AuthGateIntent } }
  | { name: "auth_intent_resolved"; params: { intent: AuthGateIntent; jersey_id: string } }
  | { name: "sign_up"; params: { provider: "google" | "email"; has_intent_context: boolean } }
  | { name: "login"; params: { provider: "google" | "email" } }
  | { name: "onboarding_completed"; params: { has_favorite_club: boolean } }
  | { name: "first_jersey_added"; params: { jersey_id: string; club_id: string; time_since_signup_ms: number } }
  | { name: "jersey_added_to_collection"; params: { jersey_id: string; club_id: string; league_id: string; is_first: boolean } }
  | { name: "jersey_added_to_wishlist"; params: { jersey_id: string; club_id: string; league_id: string; is_first: boolean } }
  | { name: "jersey_removed_from_wishlist"; params: { jersey_id: string } }
  | { name: "jersey_rated"; params: { jersey_id: string; rating: number } }
  | { name: "jersey_reported"; params: { jersey_id: string; category: string } }
  | { name: "wishlist_pdf_generated"; params: { jersey_count: number } }
  | { name: "friend_request_sent"; params: { target_user_id: string } }
  | { name: "friend_request_accepted"; params: { requester_id: string } };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const ANALYTICS_CONSENT_REGEX = /(?:^|;\s*)cookieConsentAnalytics=true(?:;|$)/;

function getGtag(): ((...args: unknown[]) => void) | undefined {
  if (typeof window === "undefined") return undefined;
  return window.gtag;
}

function hasAnalyticsConsentSync(): boolean {
  if (typeof document === "undefined") return false;
  return ANALYTICS_CONSENT_REGEX.test(document.cookie);
}

export function trackEvent(event: AnalyticsEvent): void {
  const gtag = getGtag();
  if (!gtag) return;
  if (!hasAnalyticsConsentSync()) return;
  gtag("event", event.name, event.params);
}

export function setAnalyticsUserId(userId: string): void {
  const gtag = getGtag();
  if (!gtag) return;
  if (!hasAnalyticsConsentSync()) return;
  const id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;
  if (!id) return;
  gtag("config", id, { user_id: userId });
}

export function clearAnalyticsUserId(): void {
  const gtag = getGtag();
  if (!gtag) return;
  if (!hasAnalyticsConsentSync()) return;
  const id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;
  if (!id) return;
  gtag("config", id, { user_id: undefined });
}
