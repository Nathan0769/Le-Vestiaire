import { describe, it, expect } from "vitest";
import { suggestClub, type ClubCandidate } from "@/lib/partner-shops/alias-suggestions";

const club = (id: string, name: string, shortName = name): ClubCandidate => ({ id, name, shortName });

const CLUBS = [
  club("rangers", "Rangers FC", "Rangers"),
  club("qpr", "Queens Park Rangers", "QPR"),
  club("sevilla", "Séville FC", "Séville"),
  club("om", "Olympique de Marseille", "OM"),
  club("club-brugge", "Club Brugge KV", "Club Brugge"),
  club("cercle", "Cercle Brugge KSV", "Cercle Brugge"),
  club("wba", "West Bromwich Albion", "West Brom"),
  club("depor", "Deportivo de La Coruña", "Deportivo"),
  club("alaves", "Deportivo Alavés", "Deportivo Alavès"),
  club("carouge", "Etoile Carouge FC", "Carouge"),
  club("inter", "Inter Milan", "Inter"),
  club("inter-miami", "Inter Miami CF", "Inter Miami"),
  club("spezia", "Spezia Calcio", "La Spezia"),
  club("rennes", "Stade Rennais FC", "Rennes"),
  club("bresil", "Brésil"),
];

describe("suggestClub", () => {
  it.each([
    ["Spezia", "spezia"],
    ["Stade Rennais", "rennes"],
  ])("sûre quand les deux noms ont les mêmes mots : %s -> %s", (name, id) => {
    expect(suggestClub(name, CLUBS)).toMatchObject({ clubId: id, strength: "strong" });
  });

  it.each([
    ["Glasgow Rangers", "rangers"],
    ["Sevilla", "sevilla"],
    ["Marseille", "om"],
    ["Club Bruges", "club-brugge"],
    ["West Bromwich", "wba"],
  ])("faible quand un nom contient l'autre ou diffère d'orthographe : %s -> %s", (name, id) => {
    expect(suggestClub(name, CLUBS)).toMatchObject({ clubId: id, strength: "weak" });
  });

  it("faible quand seule une partie des mots correspond", () => {
    expect(suggestClub("Deportivo La Corogne", CLUBS)).toMatchObject({ strength: "weak" });
  });

  it.each(["Inter Kashi", "Miami FC", "Betis Séville"])(
    "jamais sûre quand un club a un mot de plus que l'autre : %s",
    (name) => {
      expect(suggestClub(name, CLUBS)?.strength).not.toBe("strong");
    }
  );

  it("ne rapproche pas deux mots qui commencent pareil mais diffèrent (Brescia / Brésil)", () => {
    expect(suggestClub("Brescia", CLUBS)).toBeNull();
  });

  it("ne rapproche pas deux clubs qui partagent un seul mot sur trois", () => {
    expect(suggestClub("Etoile Rouge Belgrade", CLUBS)).toBeNull();
  });

  it("ne propose rien pour un club absent du catalogue", () => {
    expect(suggestClub("Niue", CLUBS)).toBeNull();
  });
});
