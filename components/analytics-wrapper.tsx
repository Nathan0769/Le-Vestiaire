"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";

/**
 * Wrapper qui charge les analytics uniquement si l'utilisateur a donné son consentement
 * Conforme RGPD/CNIL
 */
export function AnalyticsWrapper() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    setHasConsent(hasAnalyticsConsent());

    const interval = setInterval(() => {
      setHasConsent(hasAnalyticsConsent());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Ne charge pas les analytics si pas de consentement
  if (!hasConsent) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
