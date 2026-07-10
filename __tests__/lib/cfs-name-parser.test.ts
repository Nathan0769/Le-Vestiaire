import { describe, it, expect } from "vitest";
import { parseCfsSeason, parseCfsType } from "@/lib/cfs-name-parser";

describe("parseCfsSeason", () => {
  it("extrait une saison au format YYYY-YY au début", () => {
    expect(parseCfsSeason("2024-25 Real Madrid Home Shirt")).toBe("2024-25");
  });

  it("extrait une saison au format YYYY-YY au milieu", () => {
    expect(parseCfsSeason("Real Madrid Home Shirt 2024-25")).toBe("2024-25");
  });

  it("extrait une saison à 4 chiffres seule", () => {
    expect(parseCfsSeason("France 1998 Home Shirt")).toBe("1998");
  });

  it("rejette les années avant 1900", () => {
    expect(parseCfsSeason("Some 1850 weird name")).toBeNull();
  });

  it("retourne null si aucune saison détectée", () => {
    expect(parseCfsSeason("Real Madrid Home Shirt")).toBeNull();
  });

  it("prend la première saison si plusieurs", () => {
    expect(parseCfsSeason("2024-25 Vintage 1998")).toBe("2024-25");
  });
});

describe("parseCfsType", () => {
  it("détecte HOME via 'Home Shirt'", () => {
    expect(parseCfsType("2024-25 Real Madrid Home Shirt")).toBe("HOME");
  });

  it("détecte AWAY via 'Away Shirt'", () => {
    expect(parseCfsType("2024-25 Real Madrid Away Shirt")).toBe("AWAY");
  });

  it("détecte THIRD", () => {
    expect(parseCfsType("2024-25 Real Madrid Third Shirt")).toBe("THIRD");
  });

  it("détecte FOURTH", () => {
    expect(parseCfsType("2024-25 Real Madrid Fourth Shirt")).toBe("FOURTH");
  });

  it("détecte GOALKEEPER via 'Goalkeeper'", () => {
    expect(parseCfsType("2024-25 Real Madrid Goalkeeper Shirt")).toBe("GOALKEEPER");
  });

  it("détecte GOALKEEPER via ' GK '", () => {
    expect(parseCfsType("2024-25 Real Madrid GK Shirt")).toBe("GOALKEEPER");
  });

  it("détecte HALLOWEEN avant tout autre type", () => {
    expect(parseCfsType("2024-25 Real Madrid Halloween Home Shirt")).toBe("HALLOWEEN");
  });

  it("détecte OKTOBERFEST", () => {
    expect(parseCfsType("2024-25 Bayern Oktoberfest Shirt")).toBe("OKTOBERFEST");
  });

  it("détecte CENTENAIRE via '100th anniversary'", () => {
    expect(parseCfsType("AC Milan 100th Anniversary Shirt")).toBe("CENTENAIRE");
  });

  it("détecte ANNIVERSARY (générique) après les plus spécifiques", () => {
    expect(parseCfsType("2024-25 Liverpool 50th Anniversary Shirt")).toBe("ANNIVERSARY");
  });

  it("détecte HUMANRACE", () => {
    expect(parseCfsType("Arsenal Human Race Shirt")).toBe("HUMANRACE");
  });

  it("détecte CHAMPION via 'Champions Edition'", () => {
    expect(parseCfsType("2024-25 PSG Champions Edition Shirt")).toBe("CHAMPION");
  });

  it("ignore Authentic / Player Issue dans la classification de type", () => {
    expect(parseCfsType("2024-25 Real Madrid Authentic Home Shirt")).toBe("HOME");
    expect(parseCfsType("2024-25 Real Madrid Player Issue Home Shirt")).toBe("HOME");
  });

  it("retourne null si rien de matchable", () => {
    expect(parseCfsType("Random Polo")).toBeNull();
  });

  it("est case-insensitive", () => {
    expect(parseCfsType("2024-25 REAL MADRID HOME SHIRT")).toBe("HOME");
  });
});
