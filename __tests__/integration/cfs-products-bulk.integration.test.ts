import { describe, it, expect, beforeEach } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestLeague, createTestClub, createTestJersey } from "@/__tests__/helpers/fixtures";
import { bulkUpdateCfsProducts } from "@/lib/cfs-products-bulk";
import "@/__tests__/setup.integration";

const base = {
  name: "2024-25 Test Home Shirt",
  price: 100,
  promoPrice: null,
  inStock: true,
  isReference: true,
  condition: null,
  productUrl: "https://www.classicfootballshirts.com/p.html",
  imageUrl: "https://img.test/p.jpg",
  soldAt: null,
  soldPrice: null,
};

describe("bulkUpdateCfsProducts", () => {
  let jerseyId: string;

  beforeEach(async () => {
    const league = await createTestLeague();
    const club = await createTestClub(league.id);
    jerseyId = (await createTestJersey(club.id)).id;
  });

  it("écrit l'état complet et la date de passage de chaque produit", async () => {
    const old = new Date("2026-11-01T00:00:00Z");
    const a = await prismaTest.cfsProduct.create({ data: { ...base, cfsId: "A", jerseyId, lastSeenAt: old } });
    const b = await prismaTest.cfsProduct.create({ data: { ...base, cfsId: "B", jerseyId, lastSeenAt: old } });
    const now = new Date("2026-11-10T02:40:00Z");

    await bulkUpdateCfsProducts(
      [
        { id: a.id, state: { ...base, price: 98.99, promoPrice: 59.99, condition: "MINT" } },
        { id: b.id, state: { ...base, inStock: false, soldAt: now, soldPrice: 100 } },
      ],
      now
    );

    const rows = await prismaTest.cfsProduct.findMany({ orderBy: { cfsId: "asc" } });
    expect(
      rows.map((r) => [
        Number(r.price),
        r.promoPrice === null ? null : Number(r.promoPrice),
        r.condition,
        r.inStock,
        r.soldAt?.toISOString() ?? null,
        r.soldPrice === null ? null : Number(r.soldPrice),
        r.lastSeenAt.toISOString(),
      ])
    ).toEqual([
      [98.99, 59.99, "MINT", true, null, null, now.toISOString()],
      [100, null, null, false, now.toISOString(), 100, now.toISOString()],
    ]);
  });

  it("ne touche pas aux produits absents de la liste", async () => {
    const old = new Date("2026-11-01T00:00:00Z");
    const a = await prismaTest.cfsProduct.create({ data: { ...base, cfsId: "A", jerseyId, lastSeenAt: old } });
    await prismaTest.cfsProduct.create({ data: { ...base, cfsId: "B", jerseyId, lastSeenAt: old } });

    await bulkUpdateCfsProducts([{ id: a.id, state: { ...base, price: 90 } }], new Date());

    const untouched = await prismaTest.cfsProduct.findFirstOrThrow({ where: { cfsId: "B" } });
    expect([Number(untouched.price), untouched.lastSeenAt.toISOString()]).toEqual([100, old.toISOString()]);
  });
});
