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
