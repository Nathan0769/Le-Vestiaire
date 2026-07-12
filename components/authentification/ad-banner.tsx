"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  hasAdvertisingConsent,
  COOKIE_CONSENT_EVENT_NAME,
  COOKIE_CONSENT_CHANNEL,
} from "@/lib/cookie-consent";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_CLIENT = "ca-pub-1296292175464272";

interface AdBannerProps {
  slot: string;
}

function AdSlot({ slot }: AdBannerProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}

export function AdBanner({ slot }: AdBannerProps) {
  const [canShow, setCanShow] = useState(() => hasAdvertisingConsent());

  useEffect(() => {
    const update = () => setCanShow(hasAdvertisingConsent());
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

  if (!canShow) return null;

  return <AdSlot slot={slot} />;
}
