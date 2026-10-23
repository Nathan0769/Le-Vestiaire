import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import {
  createTestUser,
  createTestSetup,
  createTestSession,
} from "@/__tests__/helpers/fixtures";
import { banUser, unbanUser } from "@/lib/admin/ban-user";
import "@/__tests__/setup.integration";

const deleteFromR2 = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/r2-storage", () => ({
  deleteFromR2: (...args: unknown[]) => deleteFromR2(...args),
  USER_JERSEY_PHOTOS_BUCKET: "photos-bucket",
  AVATARS_BUCKET: "avatars-bucket",
}));

async function seedOffender() {
  const user = await createTestUser({ avatar: "u1/avatar.webp" });
  const { jersey } = await createTestSetup();
  const item = await prismaTest.userJersey.create({
    data: {
      userId: user.id,
      jerseyId: jersey.id,
      condition: "MINT",
      userPhotoUrls: ["u1/a.webp", "u1/b.webp"],
    },
  });
  await prismaTest.post.create({
    data: { authorId: user.id, type: "JERSEY_ADD", referenceId: item.id },
  });
  await createTestSession(user.id);
  return { user, item };
}

describe("banUser", () => {
  beforeEach(() => deleteFromR2.mockClear());

  it("marque le compte banni avec la raison", async () => {
    const { user } = await seedOffender();

    await banUser(user.id, "Contenu sexuel");

    const row = await prismaTest.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row).toMatchObject({ banned: true, banReason: "Contenu sexuel" });
  });

  it("supprime toutes ses sessions", async () => {
    const { user } = await seedOffender();

    await banUser(user.id, "Spam");

    expect(await prismaTest.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("masque ses posts du feed", async () => {
    const { user } = await seedOffender();

    await banUser(user.id, "Spam");

    const post = await prismaTest.post.findFirstOrThrow({ where: { authorId: user.id } });
    expect(post.deletedAt).not.toBeNull();
  });

  it("retire ses photos de collection et son avatar, en base et dans R2", async () => {
    const { user, item } = await seedOffender();

    await banUser(user.id, "Spam");

    const row = await prismaTest.userJersey.findUniqueOrThrow({ where: { id: item.id } });
    const account = await prismaTest.user.findUniqueOrThrow({ where: { id: user.id } });
    expect({ photos: row.userPhotoUrls, avatar: account.avatar }).toEqual({ photos: [], avatar: null });
    expect(deleteFromR2.mock.calls).toEqual(
      expect.arrayContaining([
        ["photos-bucket", "u1/a.webp"],
        ["photos-bucket", "u1/b.webp"],
        ["avatars-bucket", "u1/avatar.webp"],
      ])
    );
  });

  it("refuse un compte introuvable", async () => {
    await expect(banUser("inconnu", "Spam")).rejects.toThrow("USER_NOT_FOUND");
  });
});

describe("unbanUser", () => {
  it("lève le ban et efface la raison", async () => {
    const user = await createTestUser({ banned: true, banReason: "Spam" });

    await unbanUser(user.id);

    const row = await prismaTest.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row).toMatchObject({ banned: false, banReason: null });
  });
});
