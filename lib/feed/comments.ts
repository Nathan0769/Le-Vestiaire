import type { NotificationType, Prisma, PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { canInteract } from "@/lib/follow";
import { createNotification } from "@/lib/notifications/create";
import { isSupporter } from "@/lib/subscription";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

export const COMMENTS_PAGE_SIZE = 20;

export type CommentErrorCode =
  | "POST_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "COMMENT_NOT_FOUND"
  | "BLOCKED";

export class CommentError extends Error {
  constructor(public readonly code: CommentErrorCode) {
    super(code);
    this.name = "CommentError";
  }
}

const COMMENT_AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  image: true,
  plan: true,
  avatarFrame: true,
} satisfies Prisma.UserSelect;

type CommentWithAuthor = Prisma.PostCommentGetPayload<{
  include: { author: { select: typeof COMMENT_AUTHOR_SELECT } };
}>;

export interface SerializedComment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  likeCount: number;
  replyCount: number;
  hasLiked: boolean;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    isSupporter: boolean;
    avatarFrame: string | null;
  };
}

export async function serializeComment(
  comment: CommentWithAuthor,
  hasLiked: boolean
): Promise<SerializedComment> {
  const avatarUrl = comment.author.avatar
    ? await getR2PresignedUrl(AVATARS_BUCKET, comment.author.avatar, 60 * 60)
    : null;
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    parentId: comment.parentId,
    likeCount: comment.likeCount,
    replyCount: comment.replyCount,
    hasLiked,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      name: comment.author.username,
      avatarUrl,
      isSupporter: isSupporter(comment.author),
      avatarFrame: comment.author.avatarFrame,
    },
  };
}

interface ListCommentsInput {
  postId: string;
  /** null = commentaires racines, sinon les réponses de ce commentaire. */
  parentId: string | null;
  viewerId: string | null;
  cursor?: string;
}

/**
 * Page de commentaires d'un post (racines ou réponses d'un parent), en ordre
 * chronologique, avec `hasLiked` résolu pour le viewer.
 */
export async function listComments(
  input: ListCommentsInput,
  db: PrismaClient = prisma
): Promise<{ items: SerializedComment[]; nextCursor: string | null }> {
  const rows = await db.postComment.findMany({
    where: { postId: input.postId, parentId: input.parentId, deletedAt: null },
    include: { author: { select: COMMENT_AUTHOR_SELECT } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: COMMENTS_PAGE_SIZE + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > COMMENTS_PAGE_SIZE;
  const sliced = hasMore ? rows.slice(0, COMMENTS_PAGE_SIZE) : rows;

  const likedIds = new Set<string>();
  if (input.viewerId && sliced.length > 0) {
    const likes = await db.postCommentLike.findMany({
      where: {
        userId: input.viewerId,
        commentId: { in: sliced.map((c) => c.id) },
      },
      select: { commentId: true },
    });
    for (const like of likes) likedIds.add(like.commentId);
  }

  const items = await Promise.all(
    sliced.map((c) => serializeComment(c, likedIds.has(c.id)))
  );

  return {
    items,
    nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
  };
}

interface CreateCommentInput {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
}

export interface CommentPush {
  recipientId: string;
  type: NotificationType;
}

/**
 * Crée un commentaire ou une réponse.
 *
 * Un seul niveau de réponses : si `parentId` désigne lui-même une réponse, le
 * nouveau commentaire est rattaché à la racine, mais c'est bien l'auteur du
 * commentaire visé qui reçoit `COMMENT_REPLIED`.
 *
 * Retourne aussi les push à envoyer (hors transaction, par l'appelant).
 * @throws CommentError POST_NOT_FOUND | PARENT_NOT_FOUND | BLOCKED
 */
export async function createComment(
  input: CreateCommentInput,
  db: PrismaClient = prisma
): Promise<{ comment: SerializedComment; pushes: CommentPush[] }> {
  const post = await db.post.findFirst({
    where: { id: input.postId, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!post) throw new CommentError("POST_NOT_FOUND");

  if (!(await canInteract(input.authorId, post.authorId, db))) {
    throw new CommentError("BLOCKED");
  }

  let rootId: string | null = null;
  let repliedToAuthorId: string | null = null;
  if (input.parentId) {
    const target = await db.postComment.findFirst({
      where: { id: input.parentId, postId: post.id, deletedAt: null },
      select: { id: true, authorId: true, parentId: true },
    });
    if (!target) throw new CommentError("PARENT_NOT_FOUND");
    if (!(await canInteract(input.authorId, target.authorId, db))) {
      throw new CommentError("BLOCKED");
    }
    rootId = target.parentId ?? target.id;
    repliedToAuthorId = target.authorId;
  }

  const { created, pushes } = await db.$transaction(async (tx) => {
    const created = await tx.postComment.create({
      data: {
        postId: post.id,
        authorId: input.authorId,
        content: input.content,
        parentId: rootId,
      },
      include: { author: { select: COMMENT_AUTHOR_SELECT } },
    });
    await tx.post.update({
      where: { id: post.id },
      data: { commentCount: { increment: 1 } },
    });
    if (rootId) {
      await tx.postComment.update({
        where: { id: rootId },
        data: { replyCount: { increment: 1 } },
      });
    }

    const pushes: CommentPush[] = [];
    const notify = async (userId: string, type: NotificationType) => {
      const notif = await createNotification(
        {
          userId,
          type,
          actorId: input.authorId,
          postId: post.id,
          commentId: created.id,
        },
        tx
      );
      if (notif) pushes.push({ recipientId: userId, type });
    };

    if (repliedToAuthorId) {
      await notify(repliedToAuthorId, "COMMENT_REPLIED");
    }
    // L'auteur du post déjà notifié de la réponse ne reçoit pas un doublon.
    if (post.authorId !== repliedToAuthorId) {
      await notify(post.authorId, "POST_COMMENTED");
    }

    return { created, pushes };
  });

  return { comment: await serializeComment(created, false), pushes };
}

interface ToggleCommentLikeInput {
  postId: string;
  commentId: string;
  userId: string;
}

/**
 * Like / unlike un commentaire. Aucune notification (choix produit).
 * @throws CommentError COMMENT_NOT_FOUND | BLOCKED
 */
export async function toggleCommentLike(
  input: ToggleCommentLikeInput,
  db: PrismaClient = prisma
): Promise<{ hasLiked: boolean; likeCount: number }> {
  const comment = await db.postComment.findFirst({
    where: {
      id: input.commentId,
      postId: input.postId,
      deletedAt: null,
      post: { deletedAt: null },
    },
    select: { id: true, authorId: true, post: { select: { authorId: true } } },
  });
  if (!comment) throw new CommentError("COMMENT_NOT_FOUND");

  if (
    !(await canInteract(input.userId, comment.authorId, db)) ||
    !(await canInteract(input.userId, comment.post.authorId, db))
  ) {
    throw new CommentError("BLOCKED");
  }

  // Même pattern que le like de post : Serializable contre le double-click
  // (2 transactions concurrentes qui voient toutes deux "pas liké").
  return db.$transaction(
    async (tx) => {
      const existing = await tx.postCommentLike.findUnique({
        where: {
          commentId_userId: { commentId: comment.id, userId: input.userId },
        },
        select: { id: true },
      });

      if (existing) {
        await tx.postCommentLike.delete({ where: { id: existing.id } });
        await tx.postComment.updateMany({
          where: { id: comment.id, likeCount: { gt: 0 } },
          data: { likeCount: { decrement: 1 } },
        });
        const updated = await tx.postComment.findUnique({
          where: { id: comment.id },
          select: { likeCount: true },
        });
        return { hasLiked: false, likeCount: updated?.likeCount ?? 0 };
      }

      await tx.postCommentLike.create({
        data: { commentId: comment.id, userId: input.userId },
      });
      const updated = await tx.postComment.update({
        where: { id: comment.id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return { hasLiked: true, likeCount: updated.likeCount };
    },
    { isolationLevel: "Serializable" }
  );
}

/**
 * Soft-delete un commentaire. Une racine emporte ses réponses (elles seraient
 * orphelines à l'affichage). Tient à jour `Post.commentCount` et le
 * `replyCount` du parent.
 *
 * @returns le nombre de commentaires retirés (0 si déjà supprimé / introuvable)
 */
export async function softDeleteComment(
  commentId: string,
  tx: Prisma.TransactionClient
): Promise<number> {
  const comment = await tx.postComment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true, parentId: true, deletedAt: true },
  });
  if (!comment || comment.deletedAt) return 0;

  const now = new Date();
  let removed = 1;

  if (comment.parentId) {
    await tx.postComment.updateMany({
      where: { id: comment.parentId, replyCount: { gt: 0 } },
      data: { replyCount: { decrement: 1 } },
    });
  } else {
    const replies = await tx.postComment.updateMany({
      where: { parentId: comment.id, deletedAt: null },
      data: { deletedAt: now },
    });
    removed += replies.count;
  }

  await tx.postComment.update({
    where: { id: comment.id },
    data: { deletedAt: now },
  });

  // Jamais de compteur négatif, même si commentCount avait dérivé.
  const decremented = await tx.post.updateMany({
    where: { id: comment.postId, commentCount: { gte: removed } },
    data: { commentCount: { decrement: removed } },
  });
  if (decremented.count === 0) {
    await tx.post.updateMany({
      where: { id: comment.postId },
      data: { commentCount: 0 },
    });
  }

  return removed;
}
