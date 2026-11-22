import { describe, it, expect } from "vitest";
import { toMemberSignals, type MemberPurchase } from "./members";

const now = new Date("2026-11-22T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const rates = { EUR: 1, GBP: 1.2 };

const buy = (over: Partial<MemberPurchase> = {}): MemberPurchase => ({
  jerseyId: "j1",
  userId: "u1",
  purchasePrice: 50,
  purchaseCurrency: "EUR",
  purchaseSource: "VINTED",
  purchaseDate: daysAgo(30),
  createdAt: daysAgo(30),
  isGift: false,
  isFromMysteryBox: false,
  condition: "GOOD",
  version: "REPLICA",
  hasLongSleeves: false,
  isSigned: false,
  hasAuthCertificate: false,
  playerName: null,
  playerNumber: null,
  ...over,
});
const three = (over: Partial<MemberPurchase> = {}) =>
  ["u1", "u2", "u3"].map((userId) => buy({ userId, ...over }));

describe("toMemberSignals", () => {
  it("moins de 3 membres : aucun signal (on ne doit pas deviner le prix d'un autre)", () => {
    expect(toMemberSignals([buy(), buy({ userId: "u2" })], rates, now).size).toBe(0);
  });

  it("3 membres : une vente par achat, au prix de référence", () => {
    const signals = toMemberSignals(three(), rates, now).get("j1")!;
    expect(signals).toHaveLength(3);
    expect(signals[0]).toMatchObject({ source: "members", type: "sold", price: 50, condition: "GOOD" });
  });

  it("revente : l'état déclaré ; boutique officielle : neuf au prix public, facteur 0,45", () => {
    const resale = toMemberSignals(three({ condition: "MINT" }), rates, now).get("j1")![0];
    expect(resale.condition).toBe("MINT");
    const retail = toMemberSignals(three({ purchaseSource: "OFFICIAL_STORE", purchasePrice: 90 }), rates, now).get("j1")![0];
    expect(retail).toMatchObject({ condition: "MINT", price: 40.5 });
  });

  it("retire les primes de l'exemplaire (floqué, version) et convertit en EUR", () => {
    const flocked = toMemberSignals(three({ playerName: "Saka", purchasePrice: 69 }), rates, now).get("j1")![0];
    expect(flocked.price).toBe(50);
    const gbp = toMemberSignals(three({ purchaseCurrency: "GBP", purchasePrice: 50 }), rates, now).get("j1")![0];
    expect(gbp.price).toBe(60);
  });

  it("écarte cadeau, mystery box, sans lieu, trop vieux, réédition et match worn", () => {
    for (const over of [
      { isGift: true },
      { isFromMysteryBox: true },
      { purchaseSource: null },
      { purchaseDate: daysAgo(800) },
      { purchaseDate: null, createdAt: daysAgo(400) },
      { version: "REISSUE" },
      { version: "MATCH_WORN" },
    ]) {
      expect(toMemberSignals(three(over), rates, now).size).toBe(0);
    }
  });

  it("sans date d'achat mais ajouté récemment : retenu", () => {
    expect(toMemberSignals(three({ purchaseDate: null, createdAt: daysAgo(100) }), rates, now).size).toBe(1);
  });
});
