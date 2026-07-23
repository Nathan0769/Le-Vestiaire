import type { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

type Db = Pick<PrismaClient, "follow" | "block">;

/**
 * Retourne true si follower suit following (unilatéral).
 */
export async function isFollowing(
  followerId: string,
  followingId: string,
  db: Db = prisma
): Promise<boolean> {
  const row = await db.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
    select: { id: true },
  });
  return row !== null;
}

/**
 * Retourne true si l'un des deux users a bloqué l'autre (symétrique).
 */
export async function isBlocked(
  userA: string,
  userB: string,
  db: Db = prisma
): Promise<boolean> {
  const row = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return row !== null;
}

/**
 * Retourne true si les deux users peuvent interagir (pas de block réciproque).
 */
export async function canInteract(
  userA: string,
  userB: string,
  db: Db = prisma
): Promise<boolean> {
  return !(await isBlocked(userA, userB, db));
}

/**
 * Compte les followers d'un user.
 */
export async function getFollowersCount(
  userId: string,
  db: Db = prisma
): Promise<number> {
  return db.follow.count({ where: { followingId: userId } });
}

/**
 * Retourne la liste des userIds que l'user suit.
 */
export async function getFollowingIds(
  userId: string,
  db: Db = prisma
): Promise<string[]> {
  const rows = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}

/**
 * Retourne tous les userIds impliqués dans un block avec cet user
 * (users qu'il a bloqués + users qui l'ont bloqué). Utilisé pour filtrer les feeds/queries.
 */
export async function getBlockedIdsBothWays(
  userId: string,
  db: Db = prisma
): Promise<string[]> {
  const rows = await db.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.blockerId !== userId) ids.add(r.blockerId);
    if (r.blockedId !== userId) ids.add(r.blockedId);
  }
  return Array.from(ids);
}
