/**
 * Nom du propriétaire dans l'aperçu d'un lien de partage : son prénom, que la
 * famille reconnaît, sinon son pseudo (choix de Nathan, 2026-11-11).
 */
export function shareOwnerName(name: string | null, username: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0] ?? "";
  if (first && !first.includes("@")) return first;
  return username ? `@${username}` : null;
}
