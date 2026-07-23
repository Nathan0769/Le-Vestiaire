import type { PrismaClient, Notification, NotificationType, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type TxDb = Pick<PrismaClient, "notification" | "user"> | Prisma.TransactionClient;

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  postId?: string | null;
  commentId?: string | null;
}

/**
 * Crée une notification in-app pour un user.
 * Retourne null (sans créer) si :
 * - l'user est aussi l'actor (auto-notif : self-like, self-comment)
 * - l'user a désactivé les notifications (RGPD opt-out)
 * - l'user cible n'existe plus
 *
 * Accepte un TransactionClient Prisma pour composition dans un $transaction.
 */
export async function createNotification(
  input: CreateNotificationInput,
  db: TxDb = prisma
): Promise<Notification | null> {
  if (input.actorId && input.actorId === input.userId) return null;

  const target = await db.user.findUnique({
    where: { id: input.userId },
    select: { notificationsEnabled: true },
  });
  if (!target) return null;
  if (!target.notificationsEnabled) return null;

  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      actorId: input.actorId ?? null,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
    },
  });
}
