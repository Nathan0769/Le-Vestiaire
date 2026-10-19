// 20 h plutôt que 24 : un maillot scanné la veille au dernier passage de la nuit
// redevient prioritaire dès le premier passage suivant.
export const SUPPORTER_STALE_MS = 20 * 3600_000;

/**
 * Ordre de scan eBay : d'abord les maillots possédés par un Supporter (seuls à
 * voir la cote) non rafraîchis depuis SUPPORTER_STALE_MS, puis tout le reste.
 * Dans chaque groupe, du plus ancien au plus récent (jamais scanné en tête).
 */
export function buildRefreshQueue<T extends { jerseyId: string }>(
  owned: T[],
  seenAt: Map<string, number>,
  supporterJerseyIds: Set<string>,
  now: number,
  limit: number
): T[] {
  const lastSeen = (item: T) => seenAt.get(item.jerseyId) ?? 0;
  const byAge = (a: T, b: T) => lastSeen(a) - lastSeen(b);

  const priority: T[] = [];
  const rest: T[] = [];
  for (const item of owned) {
    const stale = now - lastSeen(item) > SUPPORTER_STALE_MS;
    if (supporterJerseyIds.has(item.jerseyId) && stale) priority.push(item);
    else rest.push(item);
  }

  return [...priority.sort(byAge), ...rest.sort(byAge)].slice(0, limit);
}
