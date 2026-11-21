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

describe("listingTraits : rééditions", () => {
  it.each([
    "Nike PSG 2004 Home Shirt Reissue M",
    "Newcastle 1995-97 Home Shirt adidas Originals Remake",
    "Maillot France 1998 Réédition officielle",
    "Score Draw Manchester City 2000 Retro Home Shirt",
    "Copa Football Ajax 1995 Retro Shirt",
    "Toffs Liverpool 1977 Retro Jersey",
    "Japan 1998 Home Jersey adidas Bringback",
    "Argentinien Trikot 1986 Neuauflage",
    "Camiseta Real Madrid 2002 reedición",
    "Maglia Milan 1988 riedizione",
  ])("%s -> REISSUE, hors base", (title) => {
    const traits = listingTraits(title);
    expect(traits.version).toBe("REISSUE");
    expect(isReferenceListing(traits)).toBe(false);
  });

  // "retro" seul : vendeurs eBay pour de vrais anciens maillots.
  it.each([
    "Arsenal 1998 Retro Vintage Home Shirt Nike L",
    "Maillot OM 1993 vintage rétro Adidas",
  ])("%s -> REPLICA (original)", (title) => {
    expect(listingTraits(title).version).toBe("REPLICA");
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

// Vague 1 (2026-11-21) : cas relevés sur les ventes réelles Terapeak.
describe("listingTraits : flocage élargi", () => {
  it.each([
    "Arsenal 2023/24 Home Shirt Saka 7 Large",
    "2024-25 Inter Milan CL Home Shirt Zielinski No.7",
    "Nike Inter Milan 2024-25 Home Shirt Size S Denzel Dumfries number 2",
    "Inter Milan Football Club UCL Home Shirt 2024/25 - Çalhanoğlu 20 - Medium",
    "Maillot PSG 2022 Mbappé n°7",
  ])("%s -> floqué", (title) => {
    expect(listingTraits(title).printed).toBe(true);
  });

  it.each([
    "Nike Inter Milan Home Shirt 2024/25 BNWT Black Blue Betsson Sport 2 Stars Mens",
    "Arsenal 2024/25 Home Shirt Size 10 Mens",
    "Portland Timbers 2024 Third Shirt 2025 MLS",
    "Lille 2024-25 Home Shirt Ligue 1 Large",
    "Arsenal 2004-06 Home Shirt (Excellent) L",
    "Nike Total 90 Inter Milan 2004 Home Shirt",
    "Real Madrid 1999/2000 Home Shirt XL",
  ])("%s -> pas de flocage", (title) => {
    expect(listingTraits(title).printed).toBe(false);
  });
});

describe("listingTraits : rééditions et garanties d'authenticité", () => {
  it.each([
    "Olympique Marseille 1990-91 Reproduction Football Shirt Away Blue Size M. NWT",
    "Arsenal 1971 Repro Home Shirt",
  ])("%s -> REISSUE", (title) => {
    expect(listingTraits(title).version).toBe("REISSUE");
  });

  it.each([
    "Nike Inter Milan 2024/25 home jersey Size L - AUTHENTIC #football #soccer #BNWT",
    "Juventus 2019 Home Shirt Genuine and Authentic",
  ])("%s -> REPLICA (garantie du vendeur)", (title) => {
    expect(listingTraits(title).version).toBe("REPLICA");
  });
});

describe("listingTraits : saison connue", () => {
  it("« 96 » d'un maillot 1996 n'est pas un numéro de joueur", () => {
    expect(listingTraits("England Home Shirt 96 L", "1996").printed).toBe(false);
    expect(listingTraits("England 1996 Home Shirt Gascoigne 8 L", "1996").printed).toBe(true);
  });
});
