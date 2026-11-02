import { describe, it, expect } from "vitest";
import { isReferenceListing, listingTraits } from "@/lib/market-value/listing-traits";

// Titres réels ou calqués sur les annonces eBay, CFS et Le Parc à Maillots.
describe("listingTraits : version", () => {
  it.each([
    // Le Parc à Maillots
    ["Nantes Domicile 2025-26 (XL/XXL)", "REPLICA"],
    ["Senegal Extérieur 2022 World Cup (M/L) [stock fan]", "REPLICA"],
    ["Spezia Third 2023-24 (XL) [stock pro]", "STOCK_PRO"],
    ["Ecosse Domicile GK 2021-22 (M) [Player Issue]", "PLAYER_ISSUE"],
    ["Bristol Rovers Extérieur 2022-23 (3XL) [match day]", "OTHER"],
    // eBay
    ["Arsenal 2004/05 Home Shirt Authentic Player Version L", "AUTHENTIC"],
    ["PSG Maillot Domicile 2023 Version Joueur", "AUTHENTIC"],
    ["Bayern Trikot 2022 Spielerversion", "AUTHENTIC"],
    ["Nike Dri-FIT ADV Barcelona 2023 Home", "AUTHENTIC"],
    ["adidas HEAT.RDY Juventus 2022", "AUTHENTIC"],
    ["Juventus 2019 Home Shirt Replica", "REPLICA"],
    ["Arsenal 2004 Home Shirt Stadium", "REPLICA"],
    // CFS
    ["2010-11 Barcelona Player Issue Home Shirt", "PLAYER_ISSUE"],
    // Pas de faux positif sur "Pro"
    ["Jupiler Pro League Club Brugge 2023 Home", "REPLICA"],
    // "100% authentic" sur eBay = garantie d'authenticité, pas une version joueur
    ["Arsenal 2004 Home Shirt 100% Authentic Genuine", "REPLICA"],
  ])("%s -> %s", (title, version) => {
    expect(listingTraits(title).version).toBe(version);
  });
});

describe("listingTraits : manches longues", () => {
  it.each([
    "Aalborg Extérieur LS 2025-26 (XL)",
    "Liverpool 2019 Home Shirt Long Sleeve",
    "Milan maglia 2006 manica lunga",
    "Real Madrid 2017 camiseta manga larga",
    "Celtic L/S 1998",
    "2004-05 Arsenal Home Shirt L/S (Excellent) L",
    "Lyon Maillot Manches Longues 2008",
    "Schalke Trikot Langarm 2001",
  ])("%s", (title) => {
    expect(listingTraits(title).longSleeve).toBe(true);
  });

  it.each(["Lens Domicile 2023 (L)", "Wolves 2019 Home Shirt"])(
    "%s : manches courtes (LS doit être un mot isolé)",
    (title) => {
      expect(listingTraits(title).longSleeve).toBe(false);
    }
  );
});

describe("listingTraits : coupe et lots", () => {
  it.each([
    "Hammarby IF Domicile 2021 (S) (Womens)",
    "Chelsea 2020 Home Shirt Womens",
    "Maillot OM Femme 2022",
    "Bayern Trikot Damen 2023",
  ])("coupe femme : %s", (title) => {
    expect(listingTraits(title).women).toBe(true);
  });

  it.each([
    "2015-16 Manchester City Third L/S Shirt Kompany #4 (Excellent) S",
    "Pakistan Domicile 2024-25 Khan #7 (M/L/XL)",
    "France 2020 Home Shirt # 10 Mbappe",
    "Arsenal 2004 Home Shirt with nameset",
    "Maillot OM 2010 floqué",
    "Barcelona 2009 home shirt flocked Messi",
  ])("flocage : %s", (title) => {
    expect(listingTraits(title).printed).toBe(true);
  });

  it("pas de flocage sur une saison ou une taille", () => {
    expect(listingTraits("Nantes Domicile 2025-26 (XL/XXL)").printed).toBe(false);
  });

  it("lot maillot + short", () => {
    expect(listingTraits("Virtus Lanciano Domicile 2014-15 (S) [with short]").bundle).toBe(true);
  });
});

describe("isReferenceListing", () => {
  it("vrai pour un maillot supporter manches courtes homme", () => {
    expect(isReferenceListing(listingTraits("Nantes Domicile 2025-26 (XL/XXL)"))).toBe(true);
  });

  it.each([
    "Spezia Third 2023-24 (XL) [stock pro]",
    "Arsenal 2004/05 Home Shirt Authentic Player Version L",
    "Bristol Rovers Extérieur 2022-23 (3XL) [match day]",
    "Aalborg Extérieur LS 2025-26 (XL)",
    "Hammarby IF Domicile 2021 (S) (Womens)",
    "Virtus Lanciano Domicile 2014-15 (S) [with short]",
    "Pakistan Domicile 2024-25 Khan #7 (M/L/XL)",
  ])("faux hors référence : %s", (title) => {
    expect(isReferenceListing(listingTraits(title))).toBe(false);
  });
});
