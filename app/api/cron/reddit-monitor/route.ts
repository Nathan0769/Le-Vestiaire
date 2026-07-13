import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { resend, FROM_EMAIL } from "@/lib/email";
import { scanReddit } from "@/lib/reddit-monitor";
import { RedditDigestEmail } from "@/emails/reddit-monitor-digest";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) {
    return NextResponse.json(
      { error: "FOUNDER_EMAIL non configuré" },
      { status: 500 }
    );
  }

  try {
    const matches = await scanReddit();

    if (matches.length === 0) {
      return NextResponse.json({ matches: 0, sent: false });
    }

    const date = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const html = await render(RedditDigestEmail({ matches, date }));

    await resend.emails.send({
      from: FROM_EMAIL,
      to: founderEmail,
      subject: `Reddit Monitor - ${matches.length} thread(s) à checker`,
      html,
    });

    return NextResponse.json({ matches: matches.length, sent: true });
  } catch (error) {
    console.error("Reddit monitor error:", error);
    return NextResponse.json({ error: "Erreur monitor" }, { status: 500 });
  }
}
