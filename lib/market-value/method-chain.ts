/**
 * Raccord de la courbe d'un maillot quand la méthode de cote change. Méthode
 * des indices de prix lors d'un changement de panier : les snapshots d'une
 * version antérieure sont multipliés par (premier snapshot de la version
 * suivante ÷ dernier snapshot de la version antérieure). La forme de
 * l'historique est gardée ; la marche due au changement de méthode disparaît.
 */
export function chainSnapshots<T extends { value: number; time: number; methodVersion: number }>(
  snapshots: T[]
): T[] {
  const sorted = [...snapshots].sort((a, b) => a.time - b.time);
  const out = sorted.map((s) => ({ ...s }));
  let factor = 1;
  // Du plus récent au plus ancien : chaque frontière ajoute son rapport au facteur cumulé.
  for (let i = out.length - 1; i >= 0; i--) {
    const next = sorted[i + 1];
    if (next && sorted[i].methodVersion !== next.methodVersion && sorted[i].value > 0) {
      factor *= next.value / sorted[i].value;
    }
    out[i].value = Math.round(sorted[i].value * factor * 100) / 100;
  }
  return out;
}
