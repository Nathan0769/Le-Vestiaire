import { describe, it, expect, beforeEach } from "vitest";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";
import { createNotification } from "./create";

describe("createNotification", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("crée une notif NEW_FOLLOWER avec actor", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    const notif = await createNotification({
      userId: alice.id,
      type: "NEW_FOLLOWER",
      actorId: bob.id,
    });

    expect(notif).not.toBeNull();
    expect(notif!.userId).toBe(alice.id);
    expect(notif!.type).toBe("NEW_FOLLOWER");
    expect(notif!.actorId).toBe(bob.id);
  });

  it("skip si notificationsEnabled = false", async () => {
    const user = await createTestUser({ notificationsEnabled: false });
    const actor = await createTestUser();

    const notif = await createNotification({
      userId: user.id,
      type: "NEW_FOLLOWER",
      actorId: actor.id,
    });

    expect(notif).toBeNull();
    const count = await prismaTest.notification.count({
      where: { userId: user.id },
    });
    expect(count).toBe(0);
  });

  it("skip si user notifie lui-même (self-like)", async () => {
    const user = await createTestUser();

    const notif = await createNotification({
      userId: user.id,
      type: "POST_LIKED",
      actorId: user.id,
    });

    expect(notif).toBeNull();
  });

  it("accepte postId et commentId pour POST_COMMENTED", async () => {
    const author = await createTestUser();
    const commenter = await createTestUser();

    const post = await prismaTest.post.create({
      data: { authorId: author.id, type: "JERSEY_ADD", referenceId: "fake" },
    });
    const comment = await prismaTest.postComment.create({
      data: { postId: post.id, authorId: commenter.id, content: "hi" },
    });

    const notif = await createNotification({
      userId: author.id,
      type: "POST_COMMENTED",
      actorId: commenter.id,
      postId: post.id,
      commentId: comment.id,
    });

    expect(notif!.postId).toBe(post.id);
    expect(notif!.commentId).toBe(comment.id);
  });
});
