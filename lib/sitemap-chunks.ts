// Vercel refuse une page ISR > 20 Mo et Google plafonne un sitemap à 50 000 URL :
// les maillots sont répartis sur plusieurs fichiers.
export const JERSEYS_PER_SITEMAP = 10_000;

const JERSEY_CHUNK_PATTERN = /^jerseys-(\d+)$/;

export function getSitemapIds(jerseyCount: number, chunkSize: number): string[] {
  const chunks = Math.ceil(jerseyCount / chunkSize);
  return ["pages", ...Array.from({ length: chunks }, (_, i) => `jerseys-${i}`)];
}

export function parseJerseyChunk(id: string): number | null {
  const match = JERSEY_CHUNK_PATTERN.exec(id);
  return match ? Number(match[1]) : null;
}
