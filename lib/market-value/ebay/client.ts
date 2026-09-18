import { redis } from "@/lib/redis";

/**
 * Client eBay Browse API (annonces actives = prix demandés).
 * Auth : OAuth client credentials (App ID + Cert ID), token caché en Redis (~2h).
 * On ne lit que des annonces publiques ; aucune donnée vendeur/PII n'est stockée.
 */

const BASE =
  (process.env.EBAY_ENV ?? "production") === "sandbox"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";

const TOKEN_KEY = "ebay:oauth:token";

export interface EbayItem {
  title: string;
  price?: { value: string; currency: string };
  condition?: string;
  buyingOptions?: string[];
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

/** Récupère un token applicatif, mis en cache Redis jusqu'à ~2 min avant expiration. */
export async function getEbayToken(): Promise<string> {
  // Le cache est une optimisation : une panne Redis ne doit pas bloquer le cron.
  try {
    const cached = await redis.get<string>(TOKEN_KEY);
    if (cached) return cached;
  } catch {
    // Redis indisponible : on récupère un token frais sans cache.
  }

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) {
    throw new Error("EBAY_APP_ID / EBAY_CERT_ID manquants");
  }

  const basic = Buffer.from(`${appId}:${certId}`).toString("base64");
  const res = await fetch(`${BASE}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });
  if (!res.ok) {
    throw new Error(`eBay OAuth ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as TokenResponse;
  try {
    await redis.set(TOKEN_KEY, json.access_token, { ex: Math.max(json.expires_in - 120, 60) });
  } catch {
    // Cache best-effort.
  }
  return json.access_token;
}

/**
 * Recherche des annonces actives pour une requête, sur un marketplace donné.
 * Renvoie les résumés d'articles (titre, prix, état). Lève en cas d'erreur HTTP
 * (le 429 quota est ainsi remonté à l'appelant qui stoppe le batch).
 */
export async function browseSearch(
  token: string,
  query: string,
  marketId: string,
  limit = 40
): Promise<EbayItem[]> {
  const url = new URL(`${BASE}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketId,
    },
  });
  if (res.status === 429) {
    throw new Error("EBAY_RATE_LIMIT");
  }
  if (!res.ok) {
    throw new Error(`eBay Browse ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { itemSummaries?: EbayItem[] };
  return json.itemSummaries ?? [];
}
