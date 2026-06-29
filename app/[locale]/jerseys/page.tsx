import prisma from "@/lib/prisma";
import { LeaguesPageClient } from "@/components/jerseys/leagues/leagues-page-client";

export const revalidate = 300;

export default async function MaillotsPage() {
  const leagues = await prisma.league.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });

  return <LeaguesPageClient leagues={leagues} />;
}
