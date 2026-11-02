import { describe, it, expect } from "vitest";
import { parsePartnerTitle } from "@/lib/partner-shops/title-parser";

// Titres réels du catalogue Le Parc à Maillots (2026-11-02).
describe("parsePartnerTitle", () => {
  it.each([
    ["Etoile Rouge Belgrade Domicile 22-23 (M/XL)", "Etoile Rouge Belgrade", "2022-23", "HOME"],
    ["Nantes Domicile 2025-26 (XL/XXL)", "Nantes", "2025-26", "HOME"],
    ["Cavalry FC Extérieur 2025 (L)", "Cavalry FC", "2025", "AWAY"],
    ["Ethiopian Coffee 2021 Extérieur (M)", "Ethiopian Coffee", "2021", "AWAY"],
    ["Santos FC GK 2024 (M)", "Santos FC", "2024", "GOALKEEPER"],
    ["Salernitana Domicile GK 2023-24 (M/L)", "Salernitana", "2023-24", "GOALKEEPER"],
    ["Boluspor Fourth 2021-22 (S)", "Boluspor", "2021-22", "FOURTH"],
    ["Real Madrid Third 2024-25 (M/L)", "Real Madrid", "2024-25", "THIRD"],
    ["Arménie Third 2024-25 (S/XXL)", "Arménie", "2024-25", "THIRD"],
    ["Danemark Domicile 2022 World Cup (XXL)", "Danemark", "2022", "HOME"],
    ["Bolton Wanderers Third 2023-24 (S) [match day]", "Bolton Wanderers", "2023-24", "THIRD"],
    ["Pakistan Domicile 2024-25 Khan #7 (M/L/XL)", "Pakistan", "2024-25", "HOME"],
    ["Valenciennes Third 2012-13 (M) * 100ans *", "Valenciennes", "2012-13", "THIRD"],
  ])("%s", (title, club, season, type) => {
    expect(parsePartnerTitle(title, "Maillot")).toMatchObject({
      club,
      season,
      type,
      longSleeve: false,
      isJersey: true,
    });
  });

  it("rattache une cinquième tenue au type SPECIAL", () => {
    expect(parsePartnerTitle("Versailles Fifth LS 2025-26 (S/M/L/XL)", "Maillot")).toMatchObject({
      club: "Versailles",
      season: "2025-26",
      type: "SPECIAL",
    });
  });

  it("repère les manches longues (LS)", () => {
    expect(parsePartnerTitle("Aalborg Extérieur LS 2025-26 (XL)", "Maillot")).toMatchObject({
      club: "Aalborg",
      type: "AWAY",
      longSleeve: true,
    });
  });

  it("lit le type Maillot Gardien", () => {
    expect(parsePartnerTitle("Catania GK 2007-08 (L)", "Maillot Gardien")).toMatchObject({
      club: "Catania",
      season: "2007-08",
      type: "GOALKEEPER",
      isJersey: true,
    });
  });

  it("écarte les maillots junior", () => {
    expect(parsePartnerTitle("Wigan Third 2022-23 JUNIOR (8 ans)", "Maillot").isJersey).toBe(false);
  });

  it("écarte une veste rangée en Maillot", () => {
    expect(parsePartnerTitle("Almeria Veste Official 2025-26 (M/L/XL)", "Maillot").isJersey).toBe(false);
  });

  it.each([
    "Edimbourg Rugby Player Jersey 22-23 (5XL)",
    "Manchester City Top Training 24-25 (S/M/L)",
    "Crystal Palace Training T-Shirt 2023-24 (XL)",
  ])("écarte le rugby et le training rangés en Maillot : %s", (title) => {
    expect(parsePartnerTitle(title, "Maillot").isJersey).toBe(false);
  });

  it("écarte les produits qui ne sont pas des maillots", () => {
    expect(parsePartnerTitle("Nantes Training T-Shirt 2025-26 (S/L)", "Training").isJersey).toBe(false);
  });

  it("renvoie saison et type null quand le titre ne les contient pas", () => {
    expect(parsePartnerTitle("Maillot mystère (M)", "Maillot")).toMatchObject({
      season: null,
      type: null,
    });
  });
});
