export type ProgressComputer = (userId: string) => Promise<number>;

/**
 * Mémoïse les calculs de progression par fonction, le temps d'une requête.
 *
 * Beaucoup de succès partagent la même métrique (les paliers d'une même
 * catégorie appellent la même `computeProgress`). Sans cache, un chargement
 * de page recalcule la même requête SQL une fois par palier. Le cache garantit
 * qu'une métrique donnée n'est calculée qu'une seule fois par requête.
 *
 * On mémorise la Promise (pas la valeur) pour dédupliquer aussi les appels
 * concurrents lancés via `Promise.all`.
 */
export function createProgressCache(userId: string) {
  const cache = new Map<ProgressComputer, Promise<number>>();

  return function getProgress(fn: ProgressComputer): Promise<number> {
    let cached = cache.get(fn);
    if (!cached) {
      cached = fn(userId);
      cache.set(fn, cached);
    }
    return cached;
  };
}
