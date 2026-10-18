import { describe, it, expect, beforeEach } from "vitest";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";
import {
  CommentError,
  createComment,
  listComments,
  softDeleteComment,
  toggleCommentLike,
} from "./comments";

async function createTestPost(authorId: string) {
  return prismaTest.post.create({
    data: { authorId, type: "CAP_REACHED", capKind: "COLLECTION_50" },
  });
}

async function setup() {
  const postAuthor = await createTestUser();
  const alice = await createTestUser();
  const bob = await createTestUser();
  const post = await createTestPost(postAuthor.id);
  return { postAuthor, alice, bob, post };
}

describe("createComment", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("crée un commentaire racine et incrémente commentCount", async () => {
    const { alice, post } = await setup();

    const { comment } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Superbe maillot",
    });

    expect(comment.parentId).toBeNull();
    const updated = await prismaTest.post.findUnique({ where: { id: post.id } });
    expect(updated!.commentCount).toBe(1);
  });

  it("rattache une réponse à son parent et incrémente replyCount + commentCount", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });

    const { comment: reply } = await createComment({
      postId: post.id,
      authorId: bob.id,
      content: "Réponse",
      parentId: root.id,
    });

    expect(reply.parentId).toBe(root.id);
    const parent = await prismaTest.postComment.findUnique({ where: { id: root.id } });
    expect(parent!.replyCount).toBe(1);
    const updated = await prismaTest.post.findUnique({ where: { id: post.id } });
    expect(updated!.commentCount).toBe(2);
  });

  it("rattache une réponse à une réponse au commentaire racine", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    const { comment: reply } = await createComment({
      postId: post.id,
      authorId: bob.id,
      content: "Réponse",
      parentId: root.id,
    });

    const { comment: nested } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Réponse à la réponse",
      parentId: reply.id,
    });

    expect(nested.parentId).toBe(root.id);
  });

  it("refuse un parent appartenant à un autre post", async () => {
    const { postAuthor, alice, bob, post } = await setup();
    const otherPost = await prismaTest.post.create({
      data: { authorId: postAuthor.id, type: "CAP_REACHED", capKind: "COLLECTION_100" },
    });
    const { comment: foreign } = await createComment({
      postId: otherPost.id,
      authorId: alice.id,
      content: "Ailleurs",
    });

    await expect(
      createComment({
        postId: post.id,
        authorId: bob.id,
        content: "Réponse",
        parentId: foreign.id,
      })
    ).rejects.toMatchObject({ code: "PARENT_NOT_FOUND" });
  });

  it("refuse un parent supprimé", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await prismaTest.postComment.update({
      where: { id: root.id },
      data: { deletedAt: new Date() },
    });

    await expect(
      createComment({
        postId: post.id,
        authorId: bob.id,
        content: "Réponse",
        parentId: root.id,
      })
    ).rejects.toBeInstanceOf(CommentError);
  });

  it("refuse une réponse si l'auteur du commentaire a bloqué l'utilisateur", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await prismaTest.block.create({
      data: { blockerId: alice.id, blockedId: bob.id },
    });

    await expect(
      createComment({
        postId: post.id,
        authorId: bob.id,
        content: "Réponse",
        parentId: root.id,
      })
    ).rejects.toMatchObject({ code: "BLOCKED" });
  });

  it("notifie l'auteur du commentaire (COMMENT_REPLIED) et l'auteur du post (POST_COMMENTED)", async () => {
    const { postAuthor, alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await prismaTest.notification.deleteMany();

    const { pushes } = await createComment({
      postId: post.id,
      authorId: bob.id,
      content: "Réponse",
      parentId: root.id,
    });

    const notifs = await prismaTest.notification.findMany({
      select: { userId: true, type: true },
    });
    expect(notifs).toHaveLength(2);
    expect(notifs).toContainEqual({ userId: alice.id, type: "COMMENT_REPLIED" });
    expect(notifs).toContainEqual({ userId: postAuthor.id, type: "POST_COMMENTED" });
    expect(pushes).toHaveLength(2);
  });

  it("n'envoie qu'une notif si l'auteur du post est aussi l'auteur du commentaire", async () => {
    const { postAuthor, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: postAuthor.id,
      content: "Racine",
    });

    await createComment({
      postId: post.id,
      authorId: bob.id,
      content: "Réponse",
      parentId: root.id,
    });

    const notifs = await prismaTest.notification.findMany({
      select: { userId: true, type: true },
    });
    expect(notifs).toEqual([{ userId: postAuthor.id, type: "COMMENT_REPLIED" }]);
  });
});

describe("toggleCommentLike", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("like puis unlike, likeCount suit", async () => {
    const { alice, bob, post } = await setup();
    const { comment } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });

    const liked = await toggleCommentLike({
      postId: post.id,
      commentId: comment.id,
      userId: bob.id,
    });
    expect(liked).toEqual({ hasLiked: true, likeCount: 1 });

    const unliked = await toggleCommentLike({
      postId: post.id,
      commentId: comment.id,
      userId: bob.id,
    });
    expect(unliked).toEqual({ hasLiked: false, likeCount: 0 });
  });

  it("ne crée aucune notification", async () => {
    const { alice, bob, post } = await setup();
    const { comment } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await prismaTest.notification.deleteMany();

    await toggleCommentLike({
      postId: post.id,
      commentId: comment.id,
      userId: bob.id,
    });

    expect(await prismaTest.notification.count()).toBe(0);
  });

  it("refuse si le commentaire n'appartient pas au post de l'URL", async () => {
    const { postAuthor, alice, bob, post } = await setup();
    const otherPost = await prismaTest.post.create({
      data: { authorId: postAuthor.id, type: "CAP_REACHED", capKind: "COLLECTION_100" },
    });
    const { comment } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });

    await expect(
      toggleCommentLike({
        postId: otherPost.id,
        commentId: comment.id,
        userId: bob.id,
      })
    ).rejects.toMatchObject({ code: "COMMENT_NOT_FOUND" });
  });

  it("refuse si l'auteur du commentaire a bloqué l'utilisateur", async () => {
    const { alice, bob, post } = await setup();
    const { comment } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await prismaTest.block.create({
      data: { blockerId: alice.id, blockedId: bob.id },
    });

    await expect(
      toggleCommentLike({
        postId: post.id,
        commentId: comment.id,
        userId: bob.id,
      })
    ).rejects.toMatchObject({ code: "BLOCKED" });
  });
});

describe("softDeleteComment", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("supprime une racine avec ses réponses et décrémente commentCount de 1 + N", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await createComment({ postId: post.id, authorId: bob.id, content: "R1", parentId: root.id });
    await createComment({ postId: post.id, authorId: bob.id, content: "R2", parentId: root.id });
    await createComment({ postId: post.id, authorId: bob.id, content: "Autre racine" });

    const removed = await prismaTest.$transaction((tx) =>
      softDeleteComment(root.id, tx)
    );

    expect(removed).toBe(3);
    const alive = await prismaTest.postComment.count({
      where: { postId: post.id, deletedAt: null },
    });
    expect(alive).toBe(1);
    const updated = await prismaTest.post.findUnique({ where: { id: post.id } });
    expect(updated!.commentCount).toBe(1);
  });

  it("supprime une réponse et décrémente le replyCount du parent", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    const { comment: reply } = await createComment({
      postId: post.id,
      authorId: bob.id,
      content: "R1",
      parentId: root.id,
    });

    await prismaTest.$transaction((tx) => softDeleteComment(reply.id, tx));

    const parent = await prismaTest.postComment.findUnique({ where: { id: root.id } });
    expect(parent!.replyCount).toBe(0);
    const updated = await prismaTest.post.findUnique({ where: { id: post.id } });
    expect(updated!.commentCount).toBe(1);
  });

  it("ne fait rien sur un commentaire déjà supprimé", async () => {
    const { alice, post } = await setup();
    const { comment } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await prismaTest.$transaction((tx) => softDeleteComment(comment.id, tx));

    const removed = await prismaTest.$transaction((tx) =>
      softDeleteComment(comment.id, tx)
    );

    expect(removed).toBe(0);
    const updated = await prismaTest.post.findUnique({ where: { id: post.id } });
    expect(updated!.commentCount).toBe(0);
  });
});

describe("listComments", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("ne renvoie que les racines, avec hasLiked du viewer", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    await createComment({ postId: post.id, authorId: bob.id, content: "R1", parentId: root.id });
    await toggleCommentLike({ postId: post.id, commentId: root.id, userId: bob.id });

    const page = await listComments({ postId: post.id, parentId: null, viewerId: bob.id });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: root.id,
      parentId: null,
      likeCount: 1,
      replyCount: 1,
      hasLiked: true,
    });
    expect(page.nextCursor).toBeNull();
  });

  it("renvoie les réponses d'un parent", async () => {
    const { alice, bob, post } = await setup();
    const { comment: root } = await createComment({
      postId: post.id,
      authorId: alice.id,
      content: "Racine",
    });
    const { comment: reply } = await createComment({
      postId: post.id,
      authorId: bob.id,
      content: "R1",
      parentId: root.id,
    });

    const page = await listComments({ postId: post.id, parentId: root.id, viewerId: null });

    expect(page.items.map((c) => c.id)).toEqual([reply.id]);
    expect(page.items[0].hasLiked).toBe(false);
  });
});
