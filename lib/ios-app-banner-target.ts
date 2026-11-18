// Navigateurs iOS dont l'UA contient « Version/… Safari/ » comme Safari, mais qui
// n'affichent pas la Smart App Banner (seul Safari lit la balise apple-itunes-app).
const SAFARI_LOOKALIKES = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|YaBrowser|DuckDuckGo|Brave/;

/**
 * Le bandeau maison de l'app iOS ne sert que là où la bannière native de Safari
 * n'apparaît pas : un iPhone ou iPad hors Safari (Chrome, Firefox, navigateurs
 * intégrés d'Instagram, Facebook, Gmail...). Hors iOS, l'App Store n'a pas d'intérêt.
 *
 * `maxTouchPoints` distingue un iPad (UA de Mac depuis iPadOS 13) d'un vrai Mac.
 */
export function needsCustomIosBanner(userAgent: string, maxTouchPoints: number): boolean {
  const isIos =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (!isIos) return false;

  // Les vues web intégrées (Instagram, Facebook...) n'ont ni « Version/ » ni « Safari/ ».
  const isSafari =
    /Version\/[\d.]+.*Safari\//.test(userAgent) && !SAFARI_LOOKALIKES.test(userAgent);
  return !isSafari;
}
