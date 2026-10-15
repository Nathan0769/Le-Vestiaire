import { describe, it, expect } from "vitest";
import { getSitemapIds, parseJerseyChunk } from "@/lib/sitemap-chunks";

describe("getSitemapIds", () => {
  it("découpe les maillots en morceaux après le sitemap des pages", () => {
    expect(getSitemapIds(25_000, 10_000)).toEqual([
      "pages",
      "jerseys-0",
      "jerseys-1",
      "jerseys-2",
    ]);
  });

  it("ne crée aucun morceau maillot sans maillot", () => {
    expect(getSitemapIds(0, 10_000)).toEqual(["pages"]);
  });
});

describe("parseJerseyChunk", () => {
  it("lit l'index d'un morceau maillot et rejette le reste", () => {
    expect([
      parseJerseyChunk("jerseys-2"),
      parseJerseyChunk("pages"),
      parseJerseyChunk("jerseys-x"),
    ]).toEqual([2, null, null]);
  });
});
