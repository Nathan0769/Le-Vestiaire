"use client";

const COOKIE_CONSENT_NAME = "cookieConsent";
const COOKIE_CONSENT_ANALYTICS = "cookieConsentAnalytics";
const COOKIE_CONSENT_ADVERTISING = "cookieConsentAdvertising";

export const COOKIE_CONSENT_EVENT_NAME = "cookieconsent-changed";
export const COOKIE_CONSENT_CHANNEL = "cookieconsent";

function notifyConsentChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT_NAME));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(COOKIE_CONSENT_CHANNEL);
    channel.postMessage("changed");
    channel.close();
  }
}

export function hasConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_CONSENT_NAME}=true`);
}

export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_CONSENT_ANALYTICS}=true`);
}

export function hasAdvertisingConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_CONSENT_ADVERTISING}=true`);
}

export function setConsent(analytics: boolean, advertising: boolean): void {
  const expires = "expires=Fri, 31 Dec 9999 23:59:59 GMT";
  document.cookie = `${COOKIE_CONSENT_NAME}=true; ${expires}; path=/; SameSite=Lax`;
  document.cookie = `${COOKIE_CONSENT_ANALYTICS}=${analytics}; ${expires}; path=/; SameSite=Lax`;
  document.cookie = `${COOKIE_CONSENT_ADVERTISING}=${advertising}; ${expires}; path=/; SameSite=Lax`;
  notifyConsentChanged();
}

export function clearConsent(): void {
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `${COOKIE_CONSENT_NAME}=; ${expired}`;
  document.cookie = `${COOKIE_CONSENT_ANALYTICS}=; ${expired}`;
  document.cookie = `${COOKIE_CONSENT_ADVERTISING}=; ${expired}`;
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

export function declineConsent(): void {
  const expires = "expires=Fri, 31 Dec 9999 23:59:59 GMT";
  document.cookie = `${COOKIE_CONSENT_NAME}=true; ${expires}; path=/; SameSite=Lax`;
  document.cookie = `${COOKIE_CONSENT_ANALYTICS}=false; ${expires}; path=/; SameSite=Lax`;
  document.cookie = `${COOKIE_CONSENT_ADVERTISING}=false; ${expires}; path=/; SameSite=Lax`;
  notifyConsentChanged();
}
