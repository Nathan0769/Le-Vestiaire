import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/"],
      },

      {
        userAgent: [
          "GPTBot",
          "CCBot",
          "anthropic-ai",
          "ClaudeBot",
          "Bytespider",
          "PetalBot",
        ],
        disallow: "/",
      },

      // Google-Extended autorisé : éligibilité aux AI Overviews / Gemini grounding (objectif GEO)
      {
        userAgent: [
          "Google-Extended",
          "Claude-SearchBot",
          "OAI-SearchBot",
          "PerplexityBot",
        ],
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/"],
      },
    ],
    sitemap: "https://le-vestiaire-foot.fr/sitemap.xml",
  };
}
