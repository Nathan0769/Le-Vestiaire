import prisma from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { sendApns, apnsConfigured } from "./apns";
import { reportError } from "@/lib/report-error";
import { buildPushMessage, type PushType } from "./messages";

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
        pushTokens: {
          where: { platform: "ios" },
          select: { token: true, environment: true, locale: true },
        },
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

    // Données pour le deep-link côté app (toutes en string pour l'APNs payload).
    const data: Record<string, string> = {
      type: input.type,
      actorUsername: actor?.username ?? "",
      postId: input.postId ?? "",
      followRequestId: input.followRequestId ?? "",
    };

    const tokens = recipient.pushTokens;
    const results = await Promise.all(
      tokens.map((t) =>
        sendApns(
          t.token,
          // Texte dans la langue de chaque appareil.
          { ...buildPushMessage(input.type, actorName, t.locale), data },
          t.environment
        )
      )
    );

    // Échec hors token périmé = config APNs (clé, topic) ou panne Apple.
    for (const result of results) {
      if (!result.ok && !result.invalid) {
        await reportError("push.apns", `APNs ${result.status} ${result.reason ?? ""}`.trim());
      }
    }

    const invalidTokens = tokens
      .filter((_, i) => results[i]?.invalid)
      .map((t) => t.token);
    if (invalidTokens.length > 0) {
      await prisma.pushToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }
  } catch (err) {
    await reportError("push.notify", err);
  }
}
