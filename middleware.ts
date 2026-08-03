import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// Crawlers voraces sans valeur (IA training + espions SEO). Bloques en 403
// pour couper l'egress. Ne PAS ajouter facebookexternalhit (apercus de liens)
// ni les moteurs de recherche (googlebot, bingbot, etc. = SEO).
const BLOCKED_BOTS = /meta-externalagent|ahrefsbot|semrushbot/i;

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (BLOCKED_BOTS.test(ua)) {
    return new NextResponse(null, { status: 403 });
  }
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - static files
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
