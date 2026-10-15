import prisma from "@/lib/prisma";
import { JERSEYS_PER_SITEMAP, getSitemapIds } from "@/lib/sitemap-chunks";

const BASE_URL = "https://le-vestiaire-foot.fr";

// Généré au build comme l'ancien sitemap unique : l'URL déclarée dans
// robots.txt et la Search Console reste /sitemap.xml.
export const dynamic = "force-static";

export async function GET() {
  const jerseyCount = await prisma.jersey.count({
    where: { slug: { not: null } },
  });
  const entries = getSitemapIds(jerseyCount, JERSEYS_PER_SITEMAP)
    .map(
      (id) =>
        `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/sitemap/${id}.xml</loc>\n  </sitemap>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
