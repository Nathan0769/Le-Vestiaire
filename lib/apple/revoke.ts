import {
  appleClientSecret,
  appleSignInConfigured,
  APPLE_CLIENT_ID,
} from "./client-secret";

const TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token";
const REVOKE_ENDPOINT = "https://appleid.apple.com/auth/revoke";

/**
 * Échange l'authorization code (fourni par ASAuthorization côté app) contre un
 * refresh token Apple, à stocker pour pouvoir révoquer à la suppression du compte.
 * Retourne null si non configuré ou en cas d'échec (best-effort).
 */
export async function exchangeAppleCode(code: string): Promise<string | null> {
  if (!appleSignInConfigured()) return null;
  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: APPLE_CLIENT_ID,
        client_secret: appleClientSecret(),
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as {
      refresh_token?: string;
    } | null;
    return json?.refresh_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Révoque un refresh token Apple (requis à la suppression de compte —
 * guideline 5.1.1(v) / TN3194). Retourne true si la révocation a réussi.
 */
export async function revokeAppleToken(token: string): Promise<boolean> {
  if (!appleSignInConfigured()) return false;
  try {
    const res = await fetch(REVOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APPLE_CLIENT_ID,
        client_secret: appleClientSecret(),
        token,
        token_type_hint: "refresh_token",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
