"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  hasAnalyticsConsent,
  COOKIE_CONSENT_EVENT_NAME,
  COOKIE_CONSENT_CHANNEL,
} from "@/lib/cookie-consent";

export function AnalyticsWrapper() {
  const [hasConsent, setHasConsent] = useState(() => hasAnalyticsConsent());

  useEffect(() => {
    const update = () => setHasConsent(hasAnalyticsConsent());
    window.addEventListener(COOKIE_CONSENT_EVENT_NAME, update);

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(COOKIE_CONSENT_CHANNEL)
        : null;
    if (channel) channel.onmessage = update;

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT_NAME, update);
      if (channel) channel.close();
    };
  }, []);

  if (!hasConsent) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ?? ""} />
    </>
  );
}
