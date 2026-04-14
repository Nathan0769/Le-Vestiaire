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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Users inscrits entre 7 et 14 jours, sans maillot, avec emailMarketing activé
  const users = await prisma.user.findMany({
    where: {
      emailMarketing: true,
      createdAt: {
        gte: fourteenDaysAgo,
        lte: sevenDaysAgo,
      },
      collection: {
        none: {},
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucun utilisateur à relancer" });
  }

  let sent = 0;
  let failed = 0;

  for (const user of users) {
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

      sent++;
    } catch (error) {
      console.error(`Erreur envoi email pour ${user.id}:`, error);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: users.length });
}
