import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js nécessite unsafe-inline/unsafe-eval ; GTM charge ses propres scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      // Images : R2 (public *.r2.dev + presigned *.r2.cloudflarestorage.com), pixels GA/GTM, blobs locaux, médias clubs externes
      "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://www.google-analytics.com https://www.googletagmanager.com https://media.ol.fr https://classicfootballshirts.co.uk https://*.classicfootballshirts.co.uk",
      // Fetch/XHR : R2, GA4 (deux endpoints selon région)
      "connect-src 'self' https://*.r2.dev https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
      "media-src 'none'",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    // Expose l'URL publique du bucket R2 static au client (badges de succès).
    NEXT_PUBLIC_R2_STATIC_PUBLIC_URL:
      process.env.CLOUDFLARE_R2_STATIC_PUBLIC_URL ?? "",
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  serverExternalPackages: [
    "puppeteer-core",
    "@sparticuz/chromium",
    "sharp",
    "node-vibrant",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
