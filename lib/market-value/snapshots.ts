const toCents = (v: number) => Math.round(v * 100);

/**
 * Snapshots à écrire : seulement les maillots dont la cote a changé (au centime)
 * depuis leur dernier snapshot. La courbe reprend la dernière valeur connue, donc
 * les doublons n'apportent rien et gonfleraient la table à chaque recalcul.
 */
export function snapshotsToWrite(
  values: { jerseyId: string; baseValue: number }[],
  last: Map<string, number>
): { jerseyId: string; value: number }[] {
  return values
    .filter((v) => {
      const previous = last.get(v.jerseyId);
      return previous == null || toCents(previous) !== toCents(v.baseValue);
    })
    .map((v) => ({ jerseyId: v.jerseyId, value: v.baseValue }));
}
