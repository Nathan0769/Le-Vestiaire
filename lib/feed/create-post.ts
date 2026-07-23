import type { PrismaClient, Post, PostType, CapKind } from "@prisma/client";
import prisma from "@/lib/prisma";

type Db = Pick<PrismaClient, "post">;

interface CreateFeedPostInput {
  authorId: string;
  type: PostType;
  referenceId?: string | null;
  capKind?: CapKind | null;
  createdAtOverride?: Date;
}

/**
 * Crée un post de feed idempotent : si un post existe déjà pour (authorId + type + referenceId + capKind),
 * on le retourne tel quel. La contrainte unique en DB garantit qu'on n'a jamais deux posts identiques.
 *
 * Retourne null uniquement si l'insertion échoue avec une contrainte connue autre que l'unicité (rare, non prévu).
 */
export async function createFeedPost(
  input: CreateFeedPostInput,
  db: Db = prisma
): Promise<Post | null> {
  const referenceId = input.referenceId ?? null;
  const capKind = input.capKind ?? null;

  const existing = await db.post.findFirst({
    where: {
      authorId: input.authorId,
      type: input.type,
      referenceId,
      capKind,
    },
  });
  if (existing) return existing;

  try {
    return await db.post.create({
      data: {
        authorId: input.authorId,
        type: input.type,
        referenceId,
        capKind,
        ...(input.createdAtOverride
          ? { createdAt: input.createdAtOverride }
          : {}),
      },
    });
  } catch (error) {
    // Race condition possible : un autre process a créé le post entre findFirst et create.
    // Contrainte unique déclenchée → on renvoie l'existant.
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return db.post.findFirst({
        where: {
          authorId: input.authorId,
          type: input.type,
          referenceId,
          capKind,
        },
      });
    }
    throw error;
  }
}
