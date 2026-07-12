import prisma from "@/lib/prisma";

interface SeedRequirements {
  minJerseys?: number;
  minClubs?: number;
  minLeagues?: number;
  requireHomeJersey?: boolean;
}

export interface SeedCheckResult {
  seeded: boolean;
  reason?: string;
}

export async function checkDbSeeded(
  req: SeedRequirements,
): Promise<SeedCheckResult> {
  try {
    if (req.minJerseys) {
      const jerseyCount = await prisma.jersey.count();
      if (jerseyCount < req.minJerseys) {
        return {
          seeded: false,
          reason: `jerseys=${jerseyCount} < ${req.minJerseys}`,
        };
      }
    }
    if (req.minClubs) {
      const clubCount = await prisma.club.count();
      if (clubCount < req.minClubs) {
        return {
          seeded: false,
          reason: `clubs=${clubCount} < ${req.minClubs}`,
        };
      }
    }
    if (req.minLeagues) {
      const leagueCount = await prisma.league.count();
      if (leagueCount < req.minLeagues) {
        return {
          seeded: false,
          reason: `leagues=${leagueCount} < ${req.minLeagues}`,
        };
      }
    }
    if (req.requireHomeJersey) {
      const home = await prisma.jersey.findFirst({
        where: { type: "HOME" },
        select: { id: true },
      });
      if (!home) {
        return { seeded: false, reason: "no HOME jersey" };
      }
    }
    return { seeded: true };
  } catch (error) {
    return {
      seeded: false,
      reason: `DB error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
