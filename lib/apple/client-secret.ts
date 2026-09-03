import jwt from "jsonwebtoken";

/**
 * Client secret Apple (JWT ES256) pour les endpoints token/revoke de Sign in
 * with Apple. Nécessite une clé "Sign in with Apple" (.p8) — distincte de la
 * clé APNs. En flux natif, le client_id = bundle id de l'app.
 *
 * Env : APPLE_SIGNIN_KEY_ID, APPLE_SIGNIN_TEAM_ID, APPLE_SIGNIN_P8,
 * APPLE_SIGNIN_CLIENT_ID (défaut fr.levestiaire.app).
 */
const KEY_ID = process.env.APPLE_SIGNIN_KEY_ID;
const TEAM_ID = process.env.APPLE_SIGNIN_TEAM_ID;
const P8 = process.env.APPLE_SIGNIN_P8?.replace(/\\n/g, "\n");

export const APPLE_CLIENT_ID =
  process.env.APPLE_SIGNIN_CLIENT_ID ?? "fr.levestiaire.app";

export function appleSignInConfigured(): boolean {
  return Boolean(KEY_ID && TEAM_ID && P8);
}

export function appleClientSecret(): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: TEAM_ID,
      iat: now,
      exp: now + 300, // court : usage immédiat (token/revoke)
      aud: "https://appleid.apple.com",
      sub: APPLE_CLIENT_ID,
    },
    P8 as string,
    { algorithm: "ES256", keyid: KEY_ID }
  );
}
