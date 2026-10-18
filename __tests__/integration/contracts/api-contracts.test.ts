import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { NextRequest } from "next/server";
import type { User } from "@prisma/client";
import { prismaTest } from "@/__tests__/helpers/db";
import {
  createTestUser,
  createTestLeague,
  createTestClub,
  createTestJersey,
} from "@/__tests__/helpers/fixtures";
import { contractShape, breakingChanges } from "@/lib/contract-shape";
import { GET as getProfile } from "@/app/api/user/profile/route";
import { GET as getCollection } from "@/app/api/collection/route";
import { GET as getWishlist } from "@/app/api/wishlist/route";
import { GET as getFeed } from "@/app/api/feed/route";
import { GET as getJerseys } from "@/app/api/jerseys/route";
import { GET as getPublicProfile } from "@/app/api/users/[username]/route";
import { GET as getAppConfig } from "@/app/api/app/config/route";
import "@/__tests__/setup.integration";

/**
 * Contrat web ↔ iOS. Chaque route clé est appelée sur des données seedées et
 * sa forme (clés + types) comparée à `contracts/fixtures/<nom>.json`. L'app
 * iOS décode ces mêmes fichiers dans ses structs (target LeVestiaireTests).
 *
 * Un champ retiré ou un type nouveau (ex. devenu null) fait échouer le test.
 * Si le changement est voulu : `UPDATE_CONTRACTS=1 pnpm exec vitest run
 * __tests__/integration/contracts`, puis `scripts/sync-contracts.sh` côté iOS.
 */

vi.mock("@/lib/get-current-user", () => ({ getCurrentUser: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  standardRateLimit: {},
  generousRateLimit: {},
  getRateLimitIdentifier: vi.fn().mockResolvedValue("test-identifier"),
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: 0 }),
}));

vi.mock("@/lib/r2-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/r2-storage")>();
  return { ...actual, getR2PresignedUrl: vi.fn().mockResolvedValue("https://test.r2.dev/photo.jpg") };
});

const FIXTURES_DIR = path.resolve(__dirname, "../../../contracts/fixtures");
const UPDATE = process.env.UPDATE_CONTRACTS === "1";

async function expectContract(name: string, response: Response) {
  expect(response.status).toBe(200);
  const body = await response.json();
  const file = path.join(FIXTURES_DIR, `${name}.json`);

  if (UPDATE) {
    mkdirSync(FIXTURES_DIR, { recursive: true });
    writeFileSync(file, JSON.stringify(body, null, 2) + "\n");
    return;
  }

  expect(existsSync(file), `fixture manquante : ${name}.json (UPDATE_CONTRACTS=1)`).toBe(true);
  const fixture = JSON.parse(readFileSync(file, "utf8"));
  expect(breakingChanges(contractShape(fixture), contractShape(body))).toEqual([]);
}

async function signIn(user: User) {
  const { getCurrentUser } = await import("@/lib/get-current-user");
  vi.mocked(getCurrentUser).mockResolvedValue(user as never);
}

const createdPatchIds: string[] = [];

/** Données couvrant les champs optionnels remplis ET vides de chaque route. */
async function seed() {
  const league = await createTestLeague({ name: "Ligue 1" });
  const club = await createTestClub(league.id, { name: "PSG" });
  const jerseyWithShop = await createTestJersey(club.id, { name: "Maillot PSG Domicile 2024/25" });
  const jerseyPlain = await createTestJersey(club.id, {
    name: "Maillot PSG Gardien 2024/25",
    type: "GOALKEEPER",
    retailPrice: null,
  });
  await prismaTest.cfsAvailability.create({
    data: {
      jerseyId: jerseyWithShop.id,
      price: 89.99,
      promoPrice: 59.99,
      productUrl: "https://example.com/produit",
      affiliateUrl: "https://example.com/affilie",
      imageUrl: "https://example.com/image.jpg",
    },
  });

  const viewer = await createTestUser({
    bio: "Collectionneur",
    avatar: "avatars/viewer.jpg",
    favoriteClubId: club.id,
    plan: "PRO",
  });
  const author = await createTestUser({
    bio: "Fan du PSG",
    avatar: "avatars/author.jpg",
    favoriteClubId: club.id,
    instagramHandle: "auteur",
  });
  await prismaTest.follow.createMany({
    data: [
      { followerId: viewer.id, followingId: author.id },
      { followerId: author.id, followingId: viewer.id },
    ],
  });
  await prismaTest.account.create({
    data: { userId: viewer.id, accountId: viewer.id, providerId: "credential", password: "hash" },
  });
  const achievement = await prismaTest.achievement.create({
    data: { userId: viewer.id, key: "social.follower.first", category: "SOCIAL", tier: "BRONZE" },
  });
  await prismaTest.achievement.create({
    data: { userId: author.id, key: "social.follower.first", category: "SOCIAL", tier: "BRONZE" },
  });

  const patch = await prismaTest.patch.create({
    data: {
      name: "Ligue 1 McDonald's",
      family: "DOMESTIC_LEAGUE_BADGE",
      leagueId: league.id,
      versions: { create: { seasonStart: "2024/25", imageUrl: "https://example.com/patch.png" } },
    },
  });
  createdPatchIds.push(patch.id);

  const fullItem = await prismaTest.userJersey.create({
    data: {
      userId: viewer.id,
      jerseyId: jerseyWithShop.id,
      size: "M",
      condition: "MINT",
      hasTags: true,
      purchasePrice: 120,
      purchaseDate: new Date("2025-01-10"),
      notes: "Acheté au Parc",
      userPhotoUrls: ["photos/1.jpg", "photos/2.jpg"],
      playerName: "Dembélé",
      playerNumber: 10,
      version: "AUTHENTIC",
      isSigned: true,
      signedBy: "Ousmane Dembélé",
      hasAuthCertificate: true,
      certificateUrl: "https://example.com/certificat.pdf",
      matchDescription: "PSG - OM",
      matchDate: new Date("2025-03-16"),
      pinnedAt: new Date(),
      patches: { create: [{ patchId: patch.id }, { customLabel: "Patch fait main" }] },
    },
  });
  await prismaTest.userJersey.create({
    data: { userId: viewer.id, jerseyId: jerseyPlain.id, condition: "GOOD" },
  });
  await prismaTest.rating.create({ data: { userId: viewer.id, jerseyId: jerseyWithShop.id, rating: 4.5 } });

  await prismaTest.wishlist.createMany({
    data: [
      { userId: viewer.id, jerseyId: jerseyWithShop.id, priority: 3 },
      { userId: viewer.id, jerseyId: jerseyPlain.id },
    ],
  });

  const jerseyPost = await prismaTest.post.create({
    data: { authorId: viewer.id, type: "JERSEY_ADD", referenceId: fullItem.id, likeCount: 1 },
  });
  await prismaTest.post.create({
    data: { authorId: viewer.id, type: "ACHIEVEMENT_UNLOCK", referenceId: achievement.id },
  });
  await prismaTest.post.create({
    data: { authorId: viewer.id, type: "CAP_REACHED", capKind: "COLLECTION_50" },
  });
  await prismaTest.postLike.create({ data: { postId: jerseyPost.id, userId: author.id } });

  return { viewer, author, club };
}

describe("Contrats API web ↔ iOS", () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(async () => {
    await prismaTest.patch.deleteMany({ where: { id: { in: createdPatchIds } } });
    createdPatchIds.length = 0;
  });

  it("profil complet", async () => {
    const { viewer } = await seed();
    await signIn(viewer);
    await expectContract("profile.full", await getProfile());
  });

  it("profil minimal", async () => {
    await signIn(await createTestUser());
    await expectContract("profile.minimal", await getProfile());
  });

  it("collection", async () => {
    const { viewer } = await seed();
    await signIn(viewer);
    await expectContract("collection", await getCollection());
  });

  it("wishlist", async () => {
    const { viewer } = await seed();
    await signIn(viewer);
    await expectContract("wishlist", await getWishlist());
  });

  it("feed global", async () => {
    const { viewer } = await seed();
    await signIn(viewer);
    const request = new Request("http://localhost/api/feed?scope=global", {
      headers: { "Accept-Language": "fr" },
    });
    await expectContract("feed", await getFeed(request));
  });

  it("liste de maillots d'un club", async () => {
    const { viewer, club } = await seed();
    await signIn(viewer);
    const request = new NextRequest(`http://localhost/api/jerseys?clubId=${club.id}&limit=200`);
    await expectContract("jerseys", await getJerseys(request));
  });

  it("profil public suivi", async () => {
    const { viewer, author } = await seed();
    await signIn(viewer);
    const response = await getPublicProfile(new Request("http://localhost"), {
      params: Promise.resolve({ username: author.username! }),
    });
    await expectContract("public-profile.full", response);
  });

  it("config de l'app", async () => {
    await expectContract("app-config", await getAppConfig());
  });

  it("profil public anonyme", async () => {
    const viewer = await createTestUser();
    const anonymous = await createTestUser({ leaderboardAnonymous: true });
    await signIn(viewer);
    const response = await getPublicProfile(new Request("http://localhost"), {
      params: Promise.resolve({ username: anonymous.username! }),
    });
    await expectContract("public-profile.anonymous", response);
  });
});
