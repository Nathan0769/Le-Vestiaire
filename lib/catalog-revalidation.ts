import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/locales";

export type CachedJerseyRef = {
  id: string;
  slug: string | null;
  clubId: string;
  leagueId: string;
};

/**
 * Chemins ISR a purger quand un maillot change : la fiche (par slug et par id,
 * l'id redirigeant vers le slug) et la page de son club, dans chaque langue.
 * Les chemins internes portent toujours le segment de langue, y compris `fr`.
 */
export function jerseyCachePaths(jersey: CachedJerseyRef): string[] {
  const idParts = jersey.slug ? [jersey.slug, jersey.id] : [jersey.id];

  return locales.flatMap((locale) => {
    const clubPath = `/${locale}/jerseys/${jersey.leagueId}/clubs/${jersey.clubId}`;
    return [...idParts.map((part) => `${clubPath}/jerseys/${part}`), clubPath];
  });
}

/** A appeler apres toute ecriture admin qui change le rendu d'une fiche maillot. */
export function revalidateJerseyPages(jersey: CachedJerseyRef): void {
  for (const path of jerseyCachePaths(jersey)) {
    revalidatePath(path);
  }
}
