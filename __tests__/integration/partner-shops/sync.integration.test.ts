import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { syncPartnerShop } from "@/lib/partner-shops/sync";
import { getPartnerShop } from "@/lib/partner-shops/shops";
import type { PartnerShop, ShopProduct, ShopVariant } from "@/lib/partner-shops/types";
import { prismaTest } from "../../helpers/db";
import { createTestClub, createTestJersey, createTestLeague } from "../../helpers/fixtures";

const SHOP: PartnerShop = {
  ...getPartnerShop("leparcamaillots")!,
  slug: "test-shop",
  domain: "shop.example.com",
};
const CLUB_NAME = "Etoile Zzsync Test";
const T0 = new Date("2026-11-02T03:55:00Z");
const later = (hours: number) => new Date(T0.getTime() + hours * 3600 * 1000);

const variant = (size: string, over: Partial<ShopVariant> = {}): ShopVariant => ({
  externalId: `v-${size}`,
  size,
  price: 49.99,
  compareAtPrice: 90,
  available: true,
  ...over,
});

const product = (id: string, over: Partial<ShopProduct> = {}): ShopProduct => ({
  externalId: id,
  title: `${CLUB_NAME} Domicile 22-23 (M/L)`,
  productType: "Maillot",
  vendor: "Macron",
  url: `https://shop.example.com/products/${id}`,
  imageUrl: "https://cdn.shopify.com/s/files/1/x.jpg",
  variants: [variant("M"), variant("L", { price: 44.99 })],
  ...over,
});

const sync = (products: ShopProduct[], now: Date) =>
  syncPartnerShop(SHOP, { fetchProducts: async () => products, now });

let leagueId: string | null = null;

// La base de dev est partagée : on ne supprime que ce que ces tests créent.
async function cleanup() {
  await prismaTest.partnerProduct.deleteMany({ where: { shop: SHOP.slug } });
  await prismaTest.jersey.deleteMany({ where: { club: { name: CLUB_NAME } } });
  await prismaTest.club.deleteMany({ where: { name: CLUB_NAME } });
  if (leagueId) await prismaTest.league.deleteMany({ where: { id: leagueId } });
  leagueId = null;
}

describe("syncPartnerShop", () => {
  let jerseyId: string;

  beforeAll(cleanup);
  afterEach(cleanup);

  beforeEach(async () => {
    const league = await createTestLeague();
    leagueId = league.id;
    const club = await createTestClub(league.id, { name: CLUB_NAME, shortName: "Zzsync" });
    jerseyId = (await createTestJersey(club.id, { season: "2022-23", type: "HOME" })).id;
  });

  it("crée les maillots et leurs tailles, relie le maillot et signale sa fiche", async () => {
    const r = await sync([product("p1"), product("p2", { title: "Zzsync Veste Officielle 2025-26 (M)", productType: "Veste" })], T0);

    expect(r).toMatchObject({ fetched: 2, upserted: 1, skipped: 1, rejected: 0, removed: 0, sales: 0, cancelled: 0 });
    expect(r.changedJerseyIds).toEqual([jerseyId]);

    const p1 = await prismaTest.partnerProduct.findUniqueOrThrow({
      where: { shop_externalId: { shop: SHOP.slug, externalId: "p1" } },
      include: { variants: true },
    });
    expect(p1).toMatchObject({ jerseyId, matchStatus: "MATCHED", available: true });
    expect(Number(p1.price)).toBe(44.99);
    expect(p1.variants).toHaveLength(2);

    // Hors maillots (veste, polo...) : ni cote ni affichage, donc pas stockés.
    expect(
      await prismaTest.partnerProduct.count({ where: { shop: SHOP.slug, externalId: "p2" } })
    ).toBe(0);
  });

  it("déduit une vente SOLD_OUT puis l'annule si la taille revient sous 48 h", async () => {
    await sync([product("p1")], T0);

    const soldOut = await sync([product("p1", { variants: [variant("M", { available: false }), variant("L", { price: 44.99 })] })], later(24));
    expect(soldOut.sales).toBe(1);
    const sale = await prismaTest.partnerSale.findFirstOrThrow({ where: { shop: SHOP.slug } });
    expect(sale).toMatchObject({ kind: "SOLD_OUT", jerseyId, cancelledAt: null });
    expect(Number(sale.price)).toBe(49.99);

    const back = await sync([product("p1")], later(48));
    expect(back.cancelled).toBe(1);
    const cancelled = await prismaTest.partnerSale.findUniqueOrThrow({ where: { id: sale.id } });
    expect(cancelled.cancelledAt).toEqual(later(48));
  });

  it("déduit une vente REMOVED quand une taille disparaît, et l'annule si elle réapparaît", async () => {
    await sync([product("p1")], T0);

    const removed = await sync([product("p1", { variants: [variant("L", { price: 44.99 })] })], later(24));
    expect(removed.sales).toBe(1);
    const sale = await prismaTest.partnerSale.findFirstOrThrow({ where: { shop: SHOP.slug } });
    expect(sale.kind).toBe("REMOVED");
    const m = await prismaTest.partnerVariant.findFirstOrThrow({ where: { externalId: "v-M", product: { shop: SHOP.slug } } });
    expect(m.removedAt).toEqual(later(24));

    const back = await sync([product("p1")], later(30));
    expect(back.cancelled).toBe(1);
    const mBack = await prismaTest.partnerVariant.findUniqueOrThrow({ where: { id: m.id } });
    expect(mBack.removedAt).toBeNull();
  });

  it("marque retiré un produit absent du flux, sans vente", async () => {
    await sync([product("p1")], T0);

    const r = await sync([], later(24));
    expect(r).toMatchObject({ removed: 1, sales: 0 });
    expect(r.changedJerseyIds).toEqual([jerseyId]);
    const p1 = await prismaTest.partnerProduct.findFirstOrThrow({ where: { shop: SHOP.slug } });
    expect(p1.removedAt).toEqual(later(24));
  });

  it("ne resignale pas une fiche quand rien de visible ne change", async () => {
    await sync([product("p1")], T0);
    const r = await sync([product("p1")], later(24));
    expect(r.changedJerseyIds).toEqual([]);
  });

  it("garde un lien manuel même si le matcher dirait autre chose", async () => {
    await sync([product("p1", { title: "Club Inconnu Domicile 2022-23 (M)" })], T0);
    await prismaTest.partnerProduct.updateMany({
      where: { shop: SHOP.slug, externalId: "p1" },
      data: { matchStatus: "MANUAL", jerseyId },
    });

    await sync([product("p1", { title: "Club Inconnu Domicile 2022-23 (M)" })], later(24));
    const p1 = await prismaTest.partnerProduct.findFirstOrThrow({ where: { shop: SHOP.slug } });
    expect(p1).toMatchObject({ matchStatus: "MANUAL", jerseyId });
  });

  it("ne stocke pas les maillots de rugby (marque Rugby)", async () => {
    const r = await sync([product("p1", { title: "Stade Français Extérieur 2025-26 (XXL)", vendor: "Rugby" })], T0);
    expect(r).toMatchObject({ fetched: 1, upserted: 0, skipped: 1 });
  });

  it("refuse un produit dont l'URL sort du domaine de la boutique", async () => {
    const r = await sync([product("p1", { url: "https://evil.com/products/p1" })], T0);
    expect(r).toMatchObject({ fetched: 1, upserted: 0, rejected: 1 });
    expect(await prismaTest.partnerProduct.count({ where: { shop: SHOP.slug } })).toBe(0);
  });

  it("stocke une image hors domaine autorisé comme absente", async () => {
    await sync([product("p1", { imageUrl: "https://evil.com/x.jpg" })], T0);
    const p1 = await prismaTest.partnerProduct.findFirstOrThrow({ where: { shop: SHOP.slug } });
    expect(p1.imageUrl).toBeNull();
  });
});
