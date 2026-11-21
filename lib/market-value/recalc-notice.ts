/**
 * Phrase « Cote recalculée sur les ventes réelles d'eBay le JJ/MM » sous le
 * chiffre de la page Valeur (web et iOS), pendant 30 jours après le passage à
 * la méthode 2 : les cotes baissent d'environ un tiers ce jour-là (spec
 * docs/specs/2026-11-21-cote-vague-1.md, décision 8).
 */

/** Jour de mise en ligne de la méthode 2 (AAAA-MM-JJ), posé au déploiement ; null = pas de phrase. */
export const MARKET_RECALC_DATE: string | null = "2026-11-22";

export const RECALC_NOTICE_DAYS = 30;

/** Date du recalcul à afficher, ou null hors de la fenêtre de 30 jours. */
export function recalcNoticeDate(recalcDate: string | null, now: Date): Date | null {
  if (!recalcDate) return null;
  const start = new Date(`${recalcDate}T00:00:00Z`);
  const elapsed = now.getTime() - start.getTime();
  return elapsed >= 0 && elapsed < RECALC_NOTICE_DAYS * 86_400_000 ? start : null;
}
