import prisma from "@/lib/prisma";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/email";

export const RETENTION_DAYS = 90;
const DIGEST_LIMIT = 50;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Email immédiat au superadmin pour une erreur du parcours d'achat. Passer
 * notifiedAt de null à maintenant sert de verrou : une seule occurrence envoie,
 * même en parallèle. Si l'envoi échoue, le verrou est relâché et l'erreur
 * repart dans le digest du lendemain.
 */
export async function sendPaymentErrorAlert(fingerprint: string, now: Date = new Date()): Promise<boolean> {
  const { count } = await prisma.errorEvent.updateMany({
    where: { fingerprint, notifiedAt: null, resolvedAt: null },
    data: { notifiedAt: now },
  });
  if (count === 0) return false;

  try {
    const [event, admin] = await Promise.all([
      prisma.errorEvent.findUniqueOrThrow({ where: { fingerprint } }),
      prisma.user.findFirst({ where: { role: "superadmin" }, select: { email: true } }),
    ]);
    if (!admin?.email) throw new Error("aucun superadmin avec email");

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: admin.email,
      subject: `Paiement en échec sur Le Vestiaire : ${event.context}`,
      html:
        `<p>Une erreur bloque le parcours d'achat. Un acheteur peut avoir payé sans être passé Supporter.</p>` +
        `<p style="font-family:monospace;font-size:12px">${escapeHtml(event.context)} : ${escapeHtml(event.message)}</p>` +
        `<p><a href="${APP_URL}/fr/admin/errors">Voir toutes les erreurs</a></p>`,
    });
    if (error) throw new Error(`Resend : ${error.message}`);
    return true;
  } catch (sendError) {
    await prisma.errorEvent.updateMany({
      where: { fingerprint, notifiedAt: now },
      data: { notifiedAt: null },
    });
    throw sendError;
  }
}

/**
 * Purge les erreurs plus vues depuis 90 jours, puis envoie au superadmin les
 * erreurs nouvelles ou revenues (notifiedAt null). Rien n'est envoyé s'il n'y
 * en a aucune. Les messages viennent en partie de la route publique iOS :
 * ils sont échappés avant d'entrer dans le HTML.
 */
export async function runErrorDigest(now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count: purged } = await prisma.errorEvent.deleteMany({ where: { lastSeenAt: { lt: cutoff } } });

  const events = await prisma.errorEvent.findMany({
    where: { notifiedAt: null, resolvedAt: null },
    orderBy: { count: "desc" },
    take: DIGEST_LIMIT,
  });
  if (events.length === 0) return { sent: 0, purged };

  const admin = await prisma.user.findFirst({ where: { role: "superadmin" }, select: { email: true } });
  if (!admin?.email) return { sent: 0, purged };

  const rows = events
    .map(
      (e) =>
        `<tr><td style="padding:6px 8px;white-space:nowrap">${e.source}${e.appVersion ? ` ${escapeHtml(e.appVersion)}` : ""}</td>` +
        `<td style="padding:6px 8px">${escapeHtml(e.context)}</td>` +
        `<td style="padding:6px 8px">${escapeHtml(e.message)}</td>` +
        `<td style="padding:6px 8px;text-align:right">${e.count}</td></tr>`
    )
    .join("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: admin.email,
    subject: `${events.length} nouvelle${events.length > 1 ? "s" : ""} erreur${events.length > 1 ? "s" : ""} sur Le Vestiaire`,
    html:
      `<p>Erreurs nouvelles ou revenues depuis le dernier rapport :</p>` +
      `<table style="border-collapse:collapse;font-family:monospace;font-size:12px">${rows}</table>` +
      `<p><a href="${APP_URL}/fr/admin/errors">Voir toutes les erreurs</a></p>`,
  });

  await prisma.errorEvent.updateMany({
    where: { id: { in: events.map((e) => e.id) } },
    data: { notifiedAt: now },
  });

  return { sent: events.length, purged };
}
