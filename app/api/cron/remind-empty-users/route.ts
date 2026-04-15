import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import prisma from "@/lib/prisma";
import { resend, FROM_EMAIL, buildUnsubscribeUrl, APP_URL } from "@/lib/email";
import { ReminderNoJerseyEmail } from "@/emails/reminder-no-jersey";

export const maxDuration = 60;

export async function GET(request: Request) {
  // Protection de l'endpoint cron
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();

  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  // Rappel 1 : inscrit depuis 7-14 jours, reminderStep = 0
  const firstReminderUsers = await prisma.user.findMany({
    where: {
      emailMarketing: true,
      reminderStep: 0,
      createdAt: { gte: daysAgo(14), lte: daysAgo(7) },
      collection: { none: {} },
    },
    select: { id: true, email: true, name: true },
  });

  // Rappel 2 : inscrit depuis 30-37 jours, reminderStep = 1
  const secondReminderUsers = await prisma.user.findMany({
    where: {
      emailMarketing: true,
      reminderStep: 1,
      createdAt: { gte: daysAgo(37), lte: daysAgo(30) },
      collection: { none: {} },
    },
    select: { id: true, email: true, name: true },
  });

  let sent = 0;
  let failed = 0;

  const sendReminder = async (user: { id: string; email: string; name: string }, step: number) => {
    try {
      const unsubscribeUrl = buildUnsubscribeUrl(user.id);
      const html = await render(
        ReminderNoJerseyEmail({
          userName: user.name,
          unsubscribeUrl,
          appUrl: APP_URL,
        })
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: "Ta collection t'attend sur Le Vestiaire",
        html,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { reminderStep: step },
      });

      sent++;
    } catch (error) {
      console.error(`Erreur envoi email pour ${user.id}:`, error);
      failed++;
    }
  };

  for (const user of firstReminderUsers) {
    await sendReminder(user, 1);
  }

  for (const user of secondReminderUsers) {
    await sendReminder(user, 2);
  }

  return NextResponse.json({
    sent,
    failed,
    total: firstReminderUsers.length + secondReminderUsers.length,
    breakdown: {
      firstReminder: firstReminderUsers.length,
      secondReminder: secondReminderUsers.length,
    },
  });
}
