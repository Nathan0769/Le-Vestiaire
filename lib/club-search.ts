import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  normalizeSearchText,
  SEARCH_ACCENTS_FROM,
  SEARCH_ACCENTS_TO,
  SEARCH_STRIP_PATTERN,
} from "@/lib/search-text";

const normalized = (column: Prisma.Sql) =>
  Prisma.sql`regexp_replace(translate(lower(${column}), ${SEARCH_ACCENTS_FROM}, ${SEARCH_ACCENTS_TO}), ${SEARCH_STRIP_PATTERN}, '', 'g')`;

/**
 * Ids des clubs dont le nom (ou nom court) contient la recherche, sans tenir
 * compte des accents ni de la ponctuation : "nimes" trouve "Nîmes Olympique".
 * Normalisation faite en SQL : acceptable sur la table clubs (petite), pas sur
 * jerseys (56 000 lignes, ~600 ms).
 */
export async function findClubIdsBySearch(
  query: string,
  options: { country?: string; limit?: number } = {},
): Promise<string[]> {
  const needle = normalizeSearchText(query);
  if (!needle) return [];

  const pattern = `%${needle}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT c.id
    FROM clubs c
    JOIN leagues l ON l.id = c."leagueId"
    WHERE (${normalized(Prisma.sql`c.name`)} LIKE ${pattern}
        OR ${normalized(Prisma.sql`c."shortName"`)} LIKE ${pattern})
      ${options.country ? Prisma.sql`AND l.country = ${options.country}` : Prisma.empty}
    ORDER BY c.name ASC
    ${options.limit ? Prisma.sql`LIMIT ${options.limit}` : Prisma.empty}
  `;
  return rows.map((r) => r.id);
}
