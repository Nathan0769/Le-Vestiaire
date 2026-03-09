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
          "Google-Extended",
          "CCBot",
          "anthropic-ai",
          "ClaudeBot",
          "Bytespider",
          "PetalBot",
        ],
        disallow: "/",
      },

      {
        userAgent: ["Claude-SearchBot", "OAI-SearchBot", "PerplexityBot"],
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/"],
      },
    ],
    sitemap: "https://le-vestiaire-foot.fr/sitemap.xml",
  };
}
