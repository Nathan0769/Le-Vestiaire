/**
 * Lissage de la collecte eBay d'un maillot (phase 2, 2026-11-22) : le nouveau
 * scan est mélangé au précédent, l'ancien pesant 0,5^(jours écoulés ÷ 15). Un
 * scan de la veille compte encore pour l'essentiel, un scan d'un mois presque
 * plus. Évite qu'une annonce qui apparaît ou disparaît fasse sauter la cote.
 */
export const SMOOTHING_HALF_LIFE_DAYS = 15;

type Prices = { medianPrice: number; p25Price: number; p75Price: number };
type Previous = {
  medianPrice: number;
  p25Price: number | null;
  p75Price: number | null;
  sampleSize: number;
  methodVersion: number;
  lastSeenAt: Date;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function smoothEbay(previous: Previous | null, next: Prices, now: Date): Prices {
  // Un scan de l'ancienne méthode, ou sans annonce, ne se mélange pas au nouveau.
  if (!previous || previous.methodVersion < 2 || previous.sampleSize <= 0 || previous.medianPrice <= 0) return next;
  const days = Math.max(0, (now.getTime() - previous.lastSeenAt.getTime()) / 86_400_000);
  const w = Math.pow(0.5, days / SMOOTHING_HALF_LIFE_DAYS);
  const mix = (old: number | null, cur: number) => round2((old ?? cur) * w + cur * (1 - w));
  return {
    medianPrice: mix(previous.medianPrice, next.medianPrice),
    p25Price: mix(previous.p25Price, next.p25Price),
    p75Price: mix(previous.p75Price, next.p75Price),
  };
}
