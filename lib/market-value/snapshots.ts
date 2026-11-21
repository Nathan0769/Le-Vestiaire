/**
 * Variation en dessous de laquelle un snapshot n'est pas écrit : une annonce
 * qui apparaît ou disparaît ne doit pas dessiner une marche dans la courbe.
 * Le point du jour de la courbe suit la cote actuelle, donc rien n'est perdu.
 */
export const SNAPSHOT_MIN_CHANGE = 0.02;

/**
 * Snapshots à écrire : maillots sans snapshot, dont la cote a bougé de plus de
 * 2 % depuis le dernier, ou dont la méthode de cote a changé (point de raccord
 * de la courbe, voir method-chain.ts).
 */
export function snapshotsToWrite(
  values: { jerseyId: string; baseValue: number; methodVersion: number }[],
  last: Map<string, { value: number; methodVersion: number }>
): { jerseyId: string; value: number; methodVersion: number }[] {
  return values
    .filter((v) => {
      const previous = last.get(v.jerseyId);
      if (!previous) return true;
      if (previous.methodVersion !== v.methodVersion) return true;
      if (previous.value <= 0) return v.baseValue > 0;
      return Math.abs(v.baseValue / previous.value - 1) > SNAPSHOT_MIN_CHANGE;
    })
    .map((v) => ({ jerseyId: v.jerseyId, value: v.baseValue, methodVersion: v.methodVersion }));
}
