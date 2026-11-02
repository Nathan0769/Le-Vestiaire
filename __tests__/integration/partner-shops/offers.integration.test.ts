import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { getPartnerOffers } from "@/lib/partner-shops/offers";
import { prismaTest } from "../../helpers/db";
import { createTestClub, createTestJersey, createTestLeague } from "../../helpers/fixtures";

// Boutique réelle du registre : getPartnerOffers ne lit que les boutiques actives.
const SHOP = "leparcamaillots";
const CLUB_NAME = "Etoile Zzoffers Test";
let leagueId: string | null = null;

// La base de dev est partagée : on ne supprime que ce que ces tests créent.
async function cleanup() {
  await prismaTest.partnerProduct.deleteMany({ where: { shop: SHOP, externalId: { startsWith: "zzoffers-" } } });
  await prismaTest.partnerProduct.deleteMany({ where: { shop: "boutique-inconnue" } });
  await prismaTest.jersey.deleteMany({ where: { club: { name: CLUB_NAME } } });
  await prismaTest.club.deleteMany({ where: { name: CLUB_NAME } });
  if (leagueId) await prismaTest.league.deleteMany({ where: { id: leagueId } });
  leagueId = null;
}

async function createProduct(
  jerseyId: string,
  id: string,
  over: {
    shop?: string;
    price?: number;
    compareAtPrice?: number | null;
    available?: boolean;
    removedAt?: Date | null;
    matchStatus?: "MATCHED" | "MANUAL" | "IGNORED";
    sizes?: { size: string; available: boolean; removedAt?: Date | null }[];
  } = {}
) {
  return prismaTest.partnerProduct.create({
    data: {
      shop: over.shop ?? SHOP,
      externalId: `zzoffers-${id}`,
      title: `${CLUB_NAME} Domicile 2022-23`,
      url: `https://leparcamaillots.com/products/${id}`,
      imageUrl: null,
      price: over.price ?? 49.99,
      compareAtPrice: over.compareAtPrice === undefined ? 90 : over.compareAtPrice,
      available: over.available ?? true,
      removedAt: over.removedAt ?? null,
      jerseyId,
      matchStatus: over.matchStatus ?? "MATCHED",
      variants: {
        create: (over.sizes ?? [{ size: "M", available: true }]).map((v, i) => ({
          externalId: `${id}-v${i}`,
          size: v.size,
          price: over.price ?? 49.99,
          available: v.available,
          removedAt: v.removedAt ?? null,
        })),
      },
    },
  });
}

describe("getPartnerOffers", () => {
  let jerseyId: string;

  beforeAll(cleanup);
  afterEach(cleanup);

  beforeEach(async () => {
    const league = await createTestLeague();
    leagueId = league.id;
    const club = await createTestClub(league.id, { name: CLUB_NAME, shortName: "Zzoffers" });
    jerseyId = (await createTestJersey(club.id, { season: "2022-23", type: "HOME" })).id;
  });

  it("renvoie l'offre d'un produit dispo et relié, avec le lien sortant et les tailles dispo triées", async () => {
    await createProduct(jerseyId, "p1", {
      sizes: [
        { size: "XL", available: true },
        { size: "S", available: true },
        { size: "M", available: false },
        { size: "L", available: true, removedAt: new Date() },
      ],
    });

    const offers = await getPartnerOffers([jerseyId]);

    expect(offers.get(jerseyId)).toEqual([
      {
        shop: SHOP,
        shopName: "Le Parc à Maillots",
        logoUrl: expect.stringContaining("logo-le-parc-a-maillots"),
        itemCondition: "MINT",
        price: 49.99,
        compareAtPrice: 90,
        sizes: ["S", "XL"],
        url: "https://leparcamaillots.com/products/p1?utm_source=levestiaire&utm_medium=referral",
        promoCode: null,
      },
    ]);
  });

  it("accepte un lien posé à la main", async () => {
    await createProduct(jerseyId, "p1", { matchStatus: "MANUAL" });
    expect((await getPartnerOffers([jerseyId])).get(jerseyId)).toHaveLength(1);
  });

  it.each([
    ["indisponible", { available: false }],
    ["retiré du flux", { removedAt: new Date() }],
    ["ignoré", { matchStatus: "IGNORED" as const }],
    ["d'une boutique hors registre", { shop: "boutique-inconnue" }],
  ])("aucune offre pour un produit %s", async (_label, over) => {
    await createProduct(jerseyId, "p1", over);
    expect((await getPartnerOffers([jerseyId])).get(jerseyId)).toBeUndefined();
  });

  it("garde l'offre la moins chère quand la boutique a deux produits pour ce maillot", async () => {
    await createProduct(jerseyId, "p1", { price: 59.99 });
    await createProduct(jerseyId, "p2", { price: 44.99 });
    const offers = (await getPartnerOffers([jerseyId])).get(jerseyId);
    expect(offers).toHaveLength(1);
    expect(offers![0].price).toBe(44.99);
  });

  it("renvoie une map vide pour une liste vide sans interroger la base", async () => {
    expect((await getPartnerOffers([])).size).toBe(0);
  });
});
