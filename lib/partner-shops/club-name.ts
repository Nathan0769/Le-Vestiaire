/** Clé de comparaison d'un nom de club entre une boutique et le catalogue. */
export function normalizeClubName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
