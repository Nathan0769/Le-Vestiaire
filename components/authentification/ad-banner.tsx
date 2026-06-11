"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { hasAdvertisingConsent } from "@/lib/cookie-consent";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_CLIENT = "ca-pub-1296292175464272";

interface AdBannerProps {
  slot: string;
}

export function AdBanner({ slot }: AdBannerProps) {
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    setCanShow(hasAdvertisingConsent());
    const interval = setInterval(() => {
      setCanShow(hasAdvertisingConsent());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canShow) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [canShow]);

  if (!canShow) return null;

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
