import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  trackEvent,
  setAnalyticsUserId,
  clearAnalyticsUserId,
} from "@/lib/analytics";

declare global {
  var gtag: ((...args: unknown[]) => void) | undefined;
}

function setConsent(value: "true" | "false"): void {
  document.cookie = `cookieConsentAnalytics=${value}; path=/`;
}

function clearCookies(): void {
  document.cookie =
    "cookieConsentAnalytics=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

describe("trackEvent", () => {
  beforeEach(() => {
    setConsent("true");
    globalThis.gtag = vi.fn();
    (window as unknown as { gtag?: unknown }).gtag = globalThis.gtag;
  });

  afterEach(() => {
    clearCookies();
    globalThis.gtag = undefined;
    (window as unknown as { gtag?: unknown }).gtag = undefined;
  });

  it("sends event to gtag when consent and gtag are available", () => {
    trackEvent({
      name: "sign_up",
      params: { provider: "google", has_intent_context: true },
    });
    expect(globalThis.gtag).toHaveBeenCalledWith("event", "sign_up", {
      provider: "google",
      has_intent_context: true,
    });
  });

  it("is a no-op when window.gtag is undefined", () => {
    (window as unknown as { gtag?: unknown }).gtag = undefined;
    expect(() =>
      trackEvent({ name: "login", params: { provider: "email" } })
    ).not.toThrow();
  });

  it("is a no-op when analytics consent is missing", () => {
    setConsent("false");
    trackEvent({ name: "login", params: { provider: "email" } });
    expect(globalThis.gtag).not.toHaveBeenCalled();
  });

  it("strict cookie parsing: rejects partial substring match", () => {
    clearCookies();
    document.cookie = "XcookieConsentAnalytics=true; path=/";
    trackEvent({ name: "login", params: { provider: "email" } });
    expect(globalThis.gtag).not.toHaveBeenCalled();
    document.cookie =
      "XcookieConsentAnalytics=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });
});

describe("setAnalyticsUserId / clearAnalyticsUserId", () => {
  const GA_ID = "G-TEST123";

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS = GA_ID;
    setConsent("true");
    globalThis.gtag = vi.fn();
    (window as unknown as { gtag?: unknown }).gtag = globalThis.gtag;
  });

  afterEach(() => {
    clearCookies();
    globalThis.gtag = undefined;
    (window as unknown as { gtag?: unknown }).gtag = undefined;
  });

  it("calls gtag config with user_id", () => {
    setAnalyticsUserId("user_cuid_abc");
    expect(globalThis.gtag).toHaveBeenCalledWith("config", GA_ID, {
      user_id: "user_cuid_abc",
    });
  });

  it("clearAnalyticsUserId resets user_id to undefined", () => {
    clearAnalyticsUserId();
    expect(globalThis.gtag).toHaveBeenCalledWith("config", GA_ID, {
      user_id: undefined,
    });
  });

  it("is a no-op when consent is missing", () => {
    setConsent("false");
    setAnalyticsUserId("user_cuid_abc");
    expect(globalThis.gtag).not.toHaveBeenCalled();
  });
});
