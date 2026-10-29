import { describe, it, expect } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser, createTestSetup } from "@/__tests__/helpers/fixtures";
import {
  countEvents,
  countActiveUsers,
  pickActivitySource,
  getCohortRows,
  getMetricUsers,
  getCohortUsers,
  getPlatformSplit,
} from "@/lib/admin/kpi";
import "@/__tests__/setup.integration";

const DAY = 86_400_000;
const NOW = new Date("2026-10-28T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const lastWeek = { start: daysAgo(7), end: NOW };

/** Un utilisateur par façon d'être classé iOS, plus un utilisateur web uniquement. */
async function seedPlatforms() {
  const viaPush = await createTestUser({ createdAt: daysAgo(1) });
  const viaSession = await createTestUser({ createdAt: daysAgo(1) });
  const viaVisit = await createTestUser({ createdAt: daysAgo(1) });
  const webOnly = await createTestUser({ createdAt: daysAgo(1) });

  await prismaTest.pushToken.create({
    data: { userId: viaPush.id, token: `tok-${viaPush.id}`, platform: "ios" },
  });
  await prismaTest.session.create({
    data: {
      userId: viaSession.id,
      token: `sess-${viaSession.id}`,
      expiresAt: new Date(NOW.getTime() + 7 * DAY),
      userAgent: "LeVestiaire/1.3 CFNetwork/3826.500.131 Darwin/24.5.0",
    },
  });
  await prismaTest.session.create({
    data: {
      userId: webOnly.id,
      token: `sess-${webOnly.id}`,
      expiresAt: new Date(NOW.getTime() + 7 * DAY),
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    },
  });
  await prismaTest.userActivityDay.create({
    data: { userId: viaVisit.id, day: daysAgo(1), platform: "ios" },
  });

  return { viaPush, viaSession, viaVisit, webOnly };
}

describe("countEvents", () => {
  it("ne compte que les inscriptions de la fenêtre", async () => {
    await createTestUser({ createdAt: daysAgo(2) });
    await createTestUser({ createdAt: daysAgo(20) });

    expect(await countEvents("signups", lastWeek, "all")).toBe(1);
  });

  it("classe iOS un utilisateur avec token push, session de l'app ou visite iOS", async () => {
    await seedPlatforms();

    expect(await countEvents("signups", lastWeek, "ios")).toBe(3);
  });

  it("filtre web exclut tout utilisateur vu sur l'app", async () => {
    await seedPlatforms();

    expect(await countEvents("signups", lastWeek, "web")).toBe(1);
  });
});

describe("exclusions", () => {
  it("ignore les comptes du staff et les comptes bannis", async () => {
    await createTestUser({ createdAt: daysAgo(1) });
    await createTestUser({ createdAt: daysAgo(1), role: "superadmin" });
    await createTestUser({ createdAt: daysAgo(1), role: "admin" });
    await createTestUser({ createdAt: daysAgo(1), banned: true });

    expect(await countEvents("signups", lastWeek, "all")).toBe(1);
  });

  it("ignore les commentaires supprimés", async () => {
    const user = await createTestUser();
    const post = await prismaTest.post.create({ data: { authorId: user.id, type: "JERSEY_ADD" } });
    await prismaTest.postComment.createMany({
      data: [
        { postId: post.id, authorId: user.id, content: "ok", createdAt: daysAgo(1) },
        { postId: post.id, authorId: user.id, content: "supprimé", createdAt: daysAgo(1), deletedAt: daysAgo(1) },
      ],
    });

    expect(await countEvents("comments", lastWeek, "all")).toBe(1);
  });
});

describe("countActiveUsers", () => {
  it("ne compte pas un post automatique comme une action", async () => {
    const user = await createTestUser({ createdAt: daysAgo(30) });
    await prismaTest.post.create({
      data: { authorId: user.id, type: "JERSEY_ADD", createdAt: daysAgo(1) },
    });

    expect(await countActiveUsers(lastWeek, "actions", "all")).toBe(0);
  });

  it("compte une seule fois un utilisateur aux actions multiples (source actions)", async () => {
    const user = await createTestUser({ createdAt: daysAgo(30) });
    const { jersey } = await createTestSetup();
    await prismaTest.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "MINT", createdAt: daysAgo(1) },
    });
    await prismaTest.wishlist.create({
      data: { userId: user.id, jerseyId: jersey.id, createdAt: daysAgo(3) },
    });

    expect(await countActiveUsers(lastWeek, "actions", "all")).toBe(1);
  });

  it("lit les jours de visite (source visites)", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    await prismaTest.userActivityDay.createMany({
      data: [
        { userId: a.id, day: daysAgo(1) },
        { userId: a.id, day: daysAgo(2) },
        { userId: b.id, day: daysAgo(10) },
      ],
    });

    expect(await countActiveUsers(lastWeek, "visits", "all")).toBe(1);
  });

  it("filtre les visites sur la plateforme de chaque visite", async () => {
    const both = await createTestUser();
    await prismaTest.userActivityDay.createMany({
      data: [
        { userId: both.id, day: daysAgo(1), platform: "ios" },
        { userId: both.id, day: daysAgo(2), platform: "web" },
      ],
    });

    expect(await countActiveUsers(lastWeek, "visits", "web")).toBe(1);
  });
});

describe("getPlatformSplit", () => {
  it("répartit les actifs sans double compte : iOS seul, web seul, les deux", async () => {
    const [iosOnly, webOnly, both] = await Promise.all([
      createTestUser(),
      createTestUser(),
      createTestUser(),
    ]);
    await prismaTest.userActivityDay.createMany({
      data: [
        { userId: iosOnly.id, day: daysAgo(1), platform: "ios" },
        { userId: webOnly.id, day: daysAgo(1), platform: "web" },
        { userId: both.id, day: daysAgo(1), platform: "ios" },
        { userId: both.id, day: daysAgo(2), platform: "web" },
      ],
    });

    expect(await getPlatformSplit(lastWeek, "visits")).toEqual({ iosOnly: 1, webOnly: 1, both: 1 });
  });
});

describe("pickActivitySource", () => {
  it("reste sur les actions tant qu'il y a moins de 7 jours de visites", async () => {
    const user = await createTestUser();
    await prismaTest.userActivityDay.createMany({
      data: [1, 2, 3].map((n) => ({ userId: user.id, day: daysAgo(n) })),
    });

    expect(await pickActivitySource()).toBe("actions");
  });

  it("passe aux visites à partir de 7 jours distincts", async () => {
    const user = await createTestUser();
    await prismaTest.userActivityDay.createMany({
      data: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ userId: user.id, day: daysAgo(n) })),
    });

    expect(await pickActivitySource()).toBe("visits");
  });
});

describe("getCohortRows", () => {
  it("renvoie la taille de cohorte et les actifs en S+1", async () => {
    // Lundi 2026-10-12 : cohorte de la semaine du 12
    const signup = new Date("2026-10-12T10:00:00Z");
    const active = await createTestUser({ createdAt: signup });
    await createTestUser({ createdAt: signup });
    await prismaTest.userActivityDay.create({
      data: { userId: active.id, day: new Date("2026-10-20T00:00:00Z") },
    });

    const rows = await getCohortRows(NOW, "visits", "all");
    const s1 = rows.find((r) => r.cohortWeek === "2026-10-12" && r.weekOffset === 1);

    expect(s1).toEqual({ cohortWeek: "2026-10-12", size: 2, weekOffset: 1, active: 1 });
  });
});

describe("getMetricUsers", () => {
  it("liste les utilisateurs d'une métrique sur un jour, avec leur plateforme", async () => {
    const { viaPush, webOnly } = await seedPlatforms();
    const { jersey } = await createTestSetup();
    await prismaTest.wishlist.createMany({
      data: [
        { userId: viaPush.id, jerseyId: jersey.id, createdAt: new Date("2026-10-27T09:00:00Z") },
        { userId: webOnly.id, jerseyId: jersey.id, createdAt: new Date("2026-10-26T09:00:00Z") },
      ],
    });

    const users = await getMetricUsers({
      metric: "wishlist",
      day: "2026-10-27",
      platform: "all",
      source: "actions",
    });

    expect(users.map((u) => [u.id, u.platform])).toEqual([[viaPush.id, "ios"]]);
  });
});

describe("getCohortUsers", () => {
  it("liste les actifs d'une cellule de cohorte", async () => {
    const signup = new Date("2026-10-12T10:00:00Z");
    const active = await createTestUser({ createdAt: signup });
    await createTestUser({ createdAt: signup });
    await prismaTest.userActivityDay.create({
      data: { userId: active.id, day: new Date("2026-10-20T00:00:00Z") },
    });

    const users = await getCohortUsers({
      cohortWeek: "2026-10-12",
      offset: 1,
      platform: "all",
      source: "visits",
      now: NOW,
    });

    expect(users.map((u) => u.id)).toEqual([active.id]);
  });
});
