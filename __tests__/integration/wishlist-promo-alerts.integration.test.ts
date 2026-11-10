import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JerseyType, User } from "@prisma/client";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser, createTestLeague, createTestClub, createTestJersey } from "@/__tests__/helpers/fixtures";
import { runWishlistPromoAlerts } from "@/lib/wishlist-promo-alerts-run";
import "@/__tests__/setup.integration";

vi.mock("@/lib/push/notify", () => ({ pushForNotification: vi.fn() }));
vi.mock("@/lib/fx", () => ({ getRatesToEur: vi.fn().mockResolvedValue({ EUR: 1 }) }));

async function jerseyOnSale(clubId: string, type: JerseyType, price: number, promoPrice: number | null) {
  const jersey = await createTestJersey(clubId, { type });
  await prismaTest.cfsAvailability.create({
    data: {
      jerseyId: jersey.id,
      price,
      promoPrice,
      productUrl: "https://cfs.test/p",
      affiliateUrl: "https://cfs.test/a",
      imageUrl: "https://cfs.test/i.jpg",
    },
  });
  return jersey;
}

// Les tests ignorent la date de démarrage réelle (16/11).
const run = () => runWishlistPromoAlerts({ startAt: new Date(0) });

describe("alertes promo wishlist", () => {
  let user: User;

  beforeEach(async () => {
    user = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);
    const a = await jerseyOnSale(club.id, "HOME", 90, 70);
    const b = await jerseyOnSale(club.id, "AWAY", 85, 50);
    await prismaTest.wishlist.createMany({
      data: [
        { userId: user.id, jerseyId: a.id },
        { userId: user.id, jerseyId: b.id },
      ],
    });
  });

  it("envoie une seule notification pour deux promos", async () => {
    await run();
    const notifications = await prismaTest.notification.findMany({ where: { userId: user.id, type: "WISHLIST_PROMO" } });
    expect(notifications).toHaveLength(1);
  });

  it("ne renvoie pas la même promo le lendemain", async () => {
    await run();
    await run();
    const notifications = await prismaTest.notification.findMany({ where: { userId: user.id, type: "WISHLIST_PROMO" } });
    expect(notifications).toHaveLength(1);
  });

  it("attend 3 jours avant une nouvelle alerte, même sur une nouvelle baisse", async () => {
    await run();
    // Nouvelle grosse baisse le lendemain : regroupée dans l'alerte suivante, pas de push.
    await prismaTest.cfsAvailability.updateMany({ data: { promoPrice: 40 } });
    await run();
    const notifications = await prismaTest.notification.findMany({ where: { userId: user.id, type: "WISHLIST_PROMO" } });
    expect(notifications).toHaveLength(1);
  });

  it("au premier passage, cache la plus petite promo et annonce la plus grosse", async () => {
    await run();
    const rows = await prismaTest.wishlist.findMany({
      where: { userId: user.id },
      select: { promoNotifiedPrice: true, jersey: { select: { type: true } } },
    });
    const notified = Object.fromEntries(rows.map((r) => [r.jersey.type, Number(r.promoNotifiedPrice)]));
    // HOME 90 -> 70 (-20 €) cachée, AWAY 85 -> 50 (-35 €) annoncée : les deux sont marquées.
    expect(notified).toEqual({ HOME: 70, AWAY: 50 });
  });

  it("ne fait rien avant la date de démarrage", async () => {
    const result = await runWishlistPromoAlerts({ now: new Date("2026-11-15T07:00:00Z") });
    expect(result.skipped).toBe("before-start");
    expect(await prismaTest.notification.count({ where: { userId: user.id } })).toBe(0);
  });
});
