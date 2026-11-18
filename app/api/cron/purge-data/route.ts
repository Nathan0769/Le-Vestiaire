import { NextResponse } from "next/server";
import { purgeExpiredSignupAttributions } from "@/lib/data-purge";

export const maxDuration = 60;

/**
 * Purges de données arrivées à échéance (durées de la politique de
 * confidentialité). Mensuel ; les futures purges s'ajoutent ici.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const signupAttributions = await purgeExpiredSignupAttributions();
  return NextResponse.json({ signupAttributions });
}
