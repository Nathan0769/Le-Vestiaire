/**
 * Connexion sociale de l'app iOS.
 *
 * Deux parcours coexistent le temps que la nouvelle app soit publiée :
 * - ancien : page `mobile-login` ouverte dans ASWebAuthenticationSession,
 *   OAuth Better Auth côté navigateur, retour par `native-bridge` ;
 * - natif : l'app obtient un idToken Google (client OAuth iOS) et l'envoie à
 *   `/api/auth/sign-in/social`, comme pour Apple. Aucune page du site.
 */

const SITE = "https://le-vestiaire-foot.fr";
const BRIDGE_URL = `${SITE}/api/auth/native-bridge`;

/**
 * Client OAuth Google de type iOS (bundle fr.levestiaire.app). Public par
 * nature : il est lisible dans l'app (même client que l'ancienne app Expo).
 */
export const GOOGLE_IOS_CLIENT_ID = "459511189476-2ch1199ek967c59ir998bdbskl9v1r9c.apps.googleusercontent.com";

/**
 * Audiences acceptées pour un idToken Google. Le client web reste en tête :
 * Better Auth l'utilise pour construire l'URL d'autorisation du site.
 */
export function googleClientIds(webClientId: string, iosClientId: string = GOOGLE_IOS_CLIENT_ID): string[] {
  return [webClientId, iosClientId].filter((id) => id.length > 0);
}

/**
 * Corps du POST `/sign-in/social` lancé par la page `mobile-login`.
 *
 * Sans `errorCallbackURL`, un échec au retour de Google (cookie d'état perdu,
 * délai dépassé) finit sur `/api/auth/error`, qui redirige vers l'accueil du
 * site : la feuille de connexion reste ouverte sur le site. On relance donc
 * une fois, puis on rend la main à l'app par le pont natif.
 */
export function mobileLoginSignInBody(provider: string, isRetry: boolean) {
  const safeProvider = /^[a-z]+$/.test(provider) ? provider : "google";
  const retryURL = `${SITE}/api/auth/mobile-login?provider=${safeProvider}&retry=1`;
  return {
    provider: safeProvider,
    callbackURL: BRIDGE_URL,
    errorCallbackURL: isRetry ? BRIDGE_URL : retryURL,
  };
}

/**
 * Deep link renvoyé par `native-bridge`. Une erreur l'emporte sur un cookie de
 * session : celui-ci peut venir d'une ancienne connexion Safari à un autre compte.
 */
export function nativeBridgeLocation({ token, error }: { token: string | null; error: string | null }): string {
  if (error !== null) {
    const code = /^[a-z_]{1,64}$/.test(error) ? error : "oauth";
    return `levestiaire://auth?error=${code}`;
  }
  if (token) return `levestiaire://auth?token=${encodeURIComponent(token)}`;
  return "levestiaire://auth?error=nosession";
}
