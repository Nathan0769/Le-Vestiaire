import { describe, it, expect, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import {
  getUserJerseyCount,
  getUserCollectionValue,
  getUserUniqueClubs,
  getUserUniqueLeagues,
  getUserVintageCount,
  getUserFollowerCount,
  getUserRatingCount,
  getUserAcceptedProposalCount,
  getUserAcceptedDescriptionCount,
  getUserProfileComplete,
  getUserAccountAgeDays,
} from "@/lib/achievements/compute";
import { checkDbSeeded } from "../../helpers/db-seeded";

const TEST_EMAIL_PREFIX = "__test_achievements_compute_";

const seedCheck = await checkDbSeeded({
  minJerseys: 3,
  minClubs: 3,
  minLeagues: 2,
});
if (!seedCheck.seeded) {
  console.warn(`[compute.test.ts] Skip DB tests: ${seedCheck.reason}`);
}

async function createTestUser(suffix: string) {
  const email = `${TEST_EMAIL_PREFIX}${suffix}@test.local`;
  return prisma.user.create({
    data: {
      email,
      name: `Test ${suffix}`,
      username: `test_${suffix}_${Date.now()}`,
    },
  });
}

describe.skipIf(!seedCheck.seeded)("compute helpers", () => {
  const cleanup: string[] = [];

  afterAll(async () => {
    if (cleanup.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: cleanup } } });
    }
  });

  it("getUserJerseyCount retourne 0 pour un user sans collection", async () => {
    const user = await createTestUser("empty");
    cleanup.push(user.id);
    expect(await getUserJerseyCount(user.id)).toBe(0);
  });

  it("getUserJerseyCount compte les entrées UserJersey", async () => {
    const user = await createTestUser("count");
    cleanup.push(user.id);

    const jerseys = await prisma.jersey.findMany({ take: 3, select: { id: true } });
    if (jerseys.length < 3) throw new Error("DB de dev doit contenir au moins 3 jerseys");

    for (const j of jerseys) {
      await prisma.userJersey.create({
        data: { userId: user.id, jerseyId: j.id, condition: "GOOD" },
      });
    }

    expect(await getUserJerseyCount(user.id)).toBe(3);
  });

  it("getUserCollectionValue somme les purchasePrice", async () => {
    const user = await createTestUser("value");
    cleanup.push(user.id);

    const jerseys = await prisma.jersey.findMany({ take: 2, select: { id: true } });
    if (jerseys.length < 2) throw new Error("DB de dev doit contenir au moins 2 jerseys");

    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jerseys[0].id, condition: "GOOD", purchasePrice: 100 },
    });
    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jerseys[1].id, condition: "GOOD", purchasePrice: 50 },
    });

    expect(await getUserCollectionValue(user.id)).toBe(150);
  });

  it("getUserCollectionValue ignore les null", async () => {
    const user = await createTestUser("value_null");
    cleanup.push(user.id);

    const jerseys = await prisma.jersey.findMany({ take: 2, select: { id: true } });
    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jerseys[0].id, condition: "GOOD", purchasePrice: 42 },
    });
    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jerseys[1].id, condition: "GOOD" },
    });

    expect(await getUserCollectionValue(user.id)).toBe(42);
  });

  it("getUserUniqueClubs compte les clubs distincts", async () => {
    const user = await createTestUser("clubs");
    cleanup.push(user.id);

    // Prendre 3 jerseys de clubs différents
    const jerseys = await prisma.jersey.findMany({
      take: 3,
      select: { id: true, clubId: true },
      distinct: ["clubId"],
    });
    if (jerseys.length < 3) throw new Error("DB de dev doit contenir 3 clubs différents");

    for (const j of jerseys) {
      await prisma.userJersey.create({
        data: { userId: user.id, jerseyId: j.id, condition: "GOOD" },
      });
    }

    expect(await getUserUniqueClubs(user.id)).toBe(3);
  });

  it("getUserVintageCount compte les maillots pre-2000", async () => {
    const user = await createTestUser("vintage");
    cleanup.push(user.id);

    const vintageJerseys = await prisma.jersey.findMany({
      where: {
        OR: [{ season: { startsWith: "19" } }, { season: { lt: "2000" } }],
      },
      take: 2,
      select: { id: true },
    });

    for (const j of vintageJerseys) {
      await prisma.userJersey.create({
        data: { userId: user.id, jerseyId: j.id, condition: "GOOD" },
      });
    }

    expect(await getUserVintageCount(user.id)).toBe(vintageJerseys.length);
  });

  it("getUserFollowerCount compte les followers (modèle follow unilatéral)", async () => {
    const user = await createTestUser("follower_self");
    const follower1 = await createTestUser("follower1");
    const follower2 = await createTestUser("follower2");
    const notFollower = await createTestUser("not_follower");
    cleanup.push(user.id, follower1.id, follower2.id, notFollower.id);

    // follower1 et follower2 suivent user
    await prisma.follow.create({
      data: { followerId: follower1.id, followingId: user.id },
    });
    await prisma.follow.create({
      data: { followerId: follower2.id, followingId: user.id },
    });
    // user suit notFollower : ne compte pas (on compte les followers reçus)
    await prisma.follow.create({
      data: { followerId: user.id, followingId: notFollower.id },
    });

    expect(await getUserFollowerCount(user.id)).toBe(2);
  });

  it("getUserRatingCount compte les ratings", async () => {
    const user = await createTestUser("rating");
    cleanup.push(user.id);

    const jerseys = await prisma.jersey.findMany({ take: 2, select: { id: true } });
    await prisma.rating.create({ data: { userId: user.id, jerseyId: jerseys[0].id, rating: 4 } });
    await prisma.rating.create({ data: { userId: user.id, jerseyId: jerseys[1].id, rating: 5 } });

    expect(await getUserRatingCount(user.id)).toBe(2);
  });

  it("getUserProfileComplete retourne 1 si avatar + favoriteClub + bio", async () => {
    const user = await createTestUser("profile_full");
    cleanup.push(user.id);

    const club = await prisma.club.findFirst({ select: { id: true } });
    if (!club) throw new Error("DB de dev doit avoir un club");

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: "avatar-key.jpg", favoriteClubId: club.id, bio: "hello" },
    });

    expect(await getUserProfileComplete(user.id)).toBe(1);
  });

  it("getUserProfileComplete retourne 0 si un champ manque", async () => {
    const user = await createTestUser("profile_partial");
    cleanup.push(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: "avatar-key.jpg", bio: "hello" },
    });

    expect(await getUserProfileComplete(user.id)).toBe(0);
  });

  it("getUserAccountAgeDays retourne l'âge en jours entiers", async () => {
    const user = await createTestUser("age");
    cleanup.push(user.id);

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { createdAt: tenDaysAgo },
    });

    const age = await getUserAccountAgeDays(user.id);
    expect(age).toBeGreaterThanOrEqual(10);
    expect(age).toBeLessThanOrEqual(11);
  });

  it("getUserAcceptedProposalCount compte les propositions acceptées (via ContributionHistory)", async () => {
    const user = await createTestUser("proposal");
    cleanup.push(user.id);

    await prisma.contributionHistory.create({
      data: { userId: user.id, action: "jersey_proposal_approved" },
    });
    await prisma.contributionHistory.create({
      data: { userId: user.id, action: "jersey_proposal_approved" },
    });
    await prisma.contributionHistory.create({
      data: { userId: user.id, action: "other" },
    });

    expect(await getUserAcceptedProposalCount(user.id)).toBe(2);
  });

  it("getUserAcceptedDescriptionCount compte les descriptions APPROVED", async () => {
    const user = await createTestUser("desc");
    cleanup.push(user.id);

    const jersey = await prisma.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB de dev doit avoir un jersey");

    await prisma.descriptionProposal.create({
      data: {
        userId: user.id,
        jerseyId: jersey.id,
        description: "test",
        status: "APPROVED",
      },
    });
    await prisma.descriptionProposal.create({
      data: {
        userId: user.id,
        jerseyId: jersey.id,
        description: "test 2",
        status: "PENDING",
      },
    });

    expect(await getUserAcceptedDescriptionCount(user.id)).toBe(1);
  });

  it("getUserUniqueLeagues compte les ligues distinctes", async () => {
    const user = await createTestUser("leagues");
    cleanup.push(user.id);

    // Prendre 2 jerseys de leagues différentes
    const clubs = await prisma.club.findMany({
      select: { id: true, leagueId: true },
      distinct: ["leagueId"],
      take: 2,
    });
    if (clubs.length < 2) throw new Error("DB de dev doit avoir 2 leagues différentes");

    const jerseys = await prisma.jersey.findMany({
      where: { clubId: { in: clubs.map((c) => c.id) } },
      distinct: ["clubId"],
      take: 2,
    });

    for (const j of jerseys) {
      await prisma.userJersey.create({
        data: { userId: user.id, jerseyId: j.id, condition: "GOOD" },
      });
    }

    expect(await getUserUniqueLeagues(user.id)).toBe(2);
  });
});
