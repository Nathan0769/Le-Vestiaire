/**
 * Les tests d'intégration vident les tables après chaque test. Un jour,
 * `cleanDatabase()` a tourné contre la prod et tout effacé : cette garde
 * refuse toute base qui pourrait être la prod, en local comme en CI (où l'URL
 * vient d'un secret GitHub qu'on ne peut pas relire).
 */

// Endpoint Neon de la prod (un hôte, pas un secret) : refusé même si
// DATABASE_URL est absent ou faux dans l'environnement.
const PROD_ENDPOINT = "ep-polished-voice-agyx1myp";

/** « ep-xxx-pooler.c-2... » et « ep-xxx.c-2... » désignent le même endpoint. */
function endpoint(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return host ? host.split(".")[0].replace(/-pooler$/, "") : null;
  } catch {
    return null;
  }
}

/** Message d'erreur si `devUrl` n'est pas une base de test sûre, sinon null. */
export function testDatabaseError(devUrl: string | undefined, prodUrl: string | undefined): string | null {
  if (!devUrl) return "DATABASE_URL_DEV n'est pas défini.";
  const dev = endpoint(devUrl);
  if (!dev) return "DATABASE_URL_DEV est illisible.";
  if (dev === PROD_ENDPOINT) return "DATABASE_URL_DEV pointe sur la base de prod.";
  if (prodUrl && endpoint(prodUrl) === dev) return "DATABASE_URL_DEV pointe sur la même base que DATABASE_URL (prod).";
  return null;
}
