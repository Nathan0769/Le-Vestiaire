import { describe, expect, it } from "vitest";
import { selectPromoAlerts, silenceSmallerHalfAtLaunch, type PromoAlertRow } from "./wishlist-promo-alerts";

const row = (over: Partial<PromoAlertRow>): PromoAlertRow => ({
  wishlistId: "w1",
  userId: "u1",
  bestPrice: 70,
  comparePrice: 90,
  notifiedPrice: null,
  ...over,
});

describe("selectPromoAlerts", () => {
  it("retient une promo jamais notifiée", () => {
    const { byUser } = selectPromoAlerts([row({})]);
    expect(byUser.get("u1")).toEqual({ count: 1, maxSaving: 20, wishlistIds: ["w1"], prices: { w1: 70 } });
  });

  it("ignore une promo déjà notifiée au même prix ou moins bas", () => {
    const { byUser } = selectPromoAlerts([row({ notifiedPrice: 70 }), row({ wishlistId: "w2", notifiedPrice: 65 })]);
    expect(byUser.size).toBe(0);
  });

  it("retient une promo qui baisse sous le prix déjà notifié", () => {
    const { byUser } = selectPromoAlerts([row({ bestPrice: 60, notifiedPrice: 70 })]);
    expect(byUser.get("u1")?.count).toBe(1);
  });

  it("remet à zéro une envie notifiée dont la promo est finie", () => {
    const { toReset, byUser } = selectPromoAlerts([row({ comparePrice: null, notifiedPrice: 70 })]);
    expect(toReset).toEqual(["w1"]);
    expect(byUser.size).toBe(0);
  });

  it("regroupe les promos d'un utilisateur avec la plus grosse économie", () => {
    const { byUser } = selectPromoAlerts([
      row({ wishlistId: "w1", bestPrice: 70, comparePrice: 90 }),
      row({ wishlistId: "w2", bestPrice: 50, comparePrice: 85 }),
    ]);
    expect(byUser.get("u1")).toMatchObject({ count: 2, maxSaving: 35, wishlistIds: ["w1", "w2"] });
  });

  it("sépare les utilisateurs", () => {
    const { byUser } = selectPromoAlerts([row({ userId: "u1" }), row({ wishlistId: "w2", userId: "u2" })]);
    expect([...byUser.keys()].sort()).toEqual(["u1", "u2"]);
  });
});

describe("selectPromoAlerts : garde-fous anti-spam", () => {
  const now = new Date("2026-11-27T07:00:00Z");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);

  it("ignore une remise de moins de 15 €", () => {
    expect(selectPromoAlerts([row({ bestPrice: 60, comparePrice: 74 })]).byUser.size).toBe(0);
  });

  it("ignore une remise de moins de 20 %", () => {
    expect(selectPromoAlerts([row({ bestPrice: 165, comparePrice: 200 })]).byUser.size).toBe(0);
  });

  it("ignore une nouvelle baisse de moins de 10 € sous le prix déjà notifié", () => {
    expect(selectPromoAlerts([row({ bestPrice: 62, notifiedPrice: 70 })]).byUser.size).toBe(0);
  });

  it("attend 3 jours entre deux alertes d'un même compte", () => {
    const { byUser } = selectPromoAlerts([row({})], { lastAlertAt: new Map([["u1", daysAgo(1)]]), now });
    expect(byUser.size).toBe(0);
  });

  it("alerte de nouveau une fois les 3 jours passés", () => {
    const { byUser } = selectPromoAlerts([row({})], { lastAlertAt: new Map([["u1", daysAgo(3)]]), now });
    expect(byUser.get("u1")?.count).toBe(1);
  });
});

describe("silenceSmallerHalfAtLaunch", () => {
  it("cache la moitié la plus petite des promos de chaque compte", () => {
    const silenced = silenceSmallerHalfAtLaunch([
      row({ wishlistId: "a", bestPrice: 50, comparePrice: 90 }), // -40 €
      row({ wishlistId: "b", bestPrice: 70, comparePrice: 90 }), // -20 €
      row({ wishlistId: "c", bestPrice: 60, comparePrice: 90 }), // -30 €
      row({ wishlistId: "d", bestPrice: 72, comparePrice: 90 }), // -18 €
    ]);
    expect(silenced.map((s) => s.wishlistId).sort()).toEqual(["b", "d"]);
  });

  it("garde la promo d'un compte qui n'en a qu'une", () => {
    expect(silenceSmallerHalfAtLaunch([row({})])).toEqual([]);
  });

  it("garde la plus grosse moitié arrondie au-dessus sur un nombre impair", () => {
    const silenced = silenceSmallerHalfAtLaunch([
      row({ wishlistId: "a", bestPrice: 50, comparePrice: 90 }),
      row({ wishlistId: "b", bestPrice: 60, comparePrice: 90 }),
      row({ wishlistId: "c", bestPrice: 70, comparePrice: 90 }),
    ]);
    expect(silenced.map((s) => s.wishlistId)).toEqual(["c"]);
  });

  it("ignore les promos sous le seuil et compte chaque compte à part", () => {
    const silenced = silenceSmallerHalfAtLaunch([
      row({ wishlistId: "a", userId: "u1", bestPrice: 50, comparePrice: 90 }),
      row({ wishlistId: "small", userId: "u1", bestPrice: 85, comparePrice: 90 }),
      row({ wishlistId: "b", userId: "u2", bestPrice: 50, comparePrice: 90 }),
      row({ wishlistId: "c", userId: "u2", bestPrice: 70, comparePrice: 90 }),
    ]);
    expect(silenced).toEqual([{ wishlistId: "c", price: 70 }]);
  });
});
