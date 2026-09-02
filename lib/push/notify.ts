import prisma from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { sendApns, apnsConfigured } from "./apns";

/**
 * Type de push : les NotificationType stockés + FOLLOW_REQUEST_RECEIVED, qui est
 * un type virtuel (non stocké en base, synthétisé depuis les demandes en attente).
 */
type PushType = NotificationType | "FOLLOW_REQUEST_RECEIVED";

/** Construit le titre/corps FR du push selon le type de notification. */
function buildMessage(
  type: PushType,
  actor: string
): { title: string; body: string } {
  switch (type) {
    case "NEW_FOLLOWER":
      return { title: "Nouvel abonné", body: `${actor} a commencé à te suivre` };
    case "FOLLOW_REQUEST_RECEIVED":
      return { title: "Demande d'abonnement", body: `${actor} souhaite te suivre` };
    case "FOLLOW_REQUEST_APPROVED":
      return { title: "Demande acceptée", body: `${actor} a accepté ta demande` };
    case "POST_LIKED":
      return { title: "Nouveau like", body: `${actor} a aimé ta publication` };
    case "POST_COMMENTED":
      return { title: "Nouveau commentaire", body: `${actor} a commenté ta publication` };
    default:
      return { title: "Le Vestiaire", body: "Tu as une nouvelle notification" };
  }
}

interface PushInput {
  recipientId: string;
  actorId?: string | null;
  type: PushType;
  postId?: string | null;
  followRequestId?: string | null;
}

/**
 * Envoie un push APNs au destinataire pour une notification donnée.
 * No-op si APNs non configuré, si opt-out (notificationsEnabled=false),
 * si aucun device, ou si l'acteur = le destinataire. Ne throw jamais.
 * Nettoie les tokens invalides (410 / BadDeviceToken).
 */
export async function pushForNotification(input: PushInput): Promise<void> {
  try {
    if (!apnsConfigured()) return;
    if (input.actorId && input.actorId === input.recipientId) return;

    const recipient = await prisma.user.findUnique({
      where: { id: input.recipientId },
      select: {
        notificationsEnabled: true,
        disabledPushTypes: true,
        pushTokens: { where: { platform: "ios" }, select: { token: true } },
      },
    });
    if (
      !recipient ||
      !recipient.notificationsEnabled ||
      recipient.pushTokens.length === 0
    ) {
      return;
    }

    // Opt-out par type (push seulement : l'inbox in-app reste créée en amont).
    // Les types virtuels (ex. FOLLOW_REQUEST_RECEIVED) ne sont pas dans l'enum,
    // donc jamais filtrés ici.
    if (recipient.disabledPushTypes.includes(input.type as NotificationType)) {
      return;
    }

    const actor = input.actorId
      ? await prisma.user.findUnique({
          where: { id: input.actorId },
          select: { username: true },
        })
      : null;
    const actorName = actor?.username ?? "Quelqu'un";
    const { title, body } = buildMessage(input.type, actorName);

    // Données pour le deep-link côté app (toutes en string pour l'APNs payload).
    const data: Record<string, string> = {
      type: input.type,
      actorUsername: actor?.username ?? "",
      postId: input.postId ?? "",
      followRequestId: input.followRequestId ?? "",
    };

    const tokens = recipient.pushTokens.map((t) => t.token);
    const results = await Promise.all(
      tokens.map((token) => sendApns(token, { title, body, data }))
    );

    const invalidTokens = tokens.filter((_, i) => results[i]?.invalid);
    if (invalidTokens.length > 0) {
      await prisma.pushToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }
  } catch (err) {
    console.error("pushForNotification error:", err);
  }
}
