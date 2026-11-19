import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/email";
import { accountLocale } from "@/lib/account-locale";
import { buildReminderEmail } from "@/lib/reminder-email";
import {
  MAX_REMINDER_STEP,
  ageInDays,
  dueReminderStep,
  reminderCandidateWindow,
  type ReminderStep,
} from "@/lib/reminders";

export const maxDuration = 60;

/**
 * Relances des comptes sans maillot (J+1, J+7, J+30), dans la langue du compte.
 * Quotidien (vercel.json). Spec : docs/specs/2026-11-18-relances-traduites.md.
 * Aucune purge ici : elles vont dans /api/cron/purge-data.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const { createdAfter, createdBefore } = reminderCandidateWindow(now);

  const candidates = await prisma.user.findMany({
    where: {
      emailMarketing: true,
      reminderStep: { lt: MAX_REMINDER_STEP },
      createdAt: { gt: createdAfter, lte: createdBefore },
      // Un compte qui ajoute un maillot sort du parcours
      collection: { none: {} },
    },
    select: { id: true, email: true, name: true, locale: true, createdAt: true, reminderStep: true },
  });

  // Cité dans J+1 (« N maillots au catalogue ») : une seule requête par passage
  const catalogCount = candidates.length > 0 ? await prisma.jersey.count() : 0;

  const breakdown: Record<`d${ReminderStep}`, number> = { d1: 0, d7: 0, d30: 0 };
  let sent = 0;
  let failed = 0;

  for (const user of candidates) {
    const step = dueReminderStep(ageInDays(user.createdAt, now), user.reminderStep);
    if (!step) continue;

    try {
      const { subject, html } = await buildReminderEmail({
        step,
        locale: accountLocale(user.locale),
        userId: user.id,
        userName: user.name,
        catalogCount,
      });

      await resend.emails.send({ from: FROM_EMAIL, to: user.email, subject, html });

      // Après l'envoi seulement : un échec sera retenté au prochain passage
      await prisma.user.update({ where: { id: user.id }, data: { reminderStep: step } });

      breakdown[`d${step}`]++;
      sent++;
    } catch (error) {
      console.error(`Erreur envoi relance pour ${user.id}:`, error);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, candidates: candidates.length, breakdown });
}
