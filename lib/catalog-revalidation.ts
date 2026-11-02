import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/locales";
import prisma from "@/lib/prisma";

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

async function loadJerseyRefs(ids: string[]): Promise<CachedJerseyRef[]> {
  const jerseys = await prisma.jersey.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true, clubId: true, club: { select: { leagueId: true } } },
  });
  return jerseys.map((j) => ({ id: j.id, slug: j.slug, clubId: j.clubId, leagueId: j.club.leagueId }));
}

/**
 * Purge les fiches de maillots connus seulement par leur id (crons de synchro
 * des boutiques). Renvoie le nombre de maillots purgés.
 */
export async function revalidateJerseysByIds(
  ids: string[],
  loadRefs: (ids: string[]) => Promise<CachedJerseyRef[]> = loadJerseyRefs
): Promise<number> {
  if (ids.length === 0) return 0;
  const refs = await loadRefs(ids);
  for (const ref of refs) revalidateJerseyPages(ref);
  return refs.length;
}
