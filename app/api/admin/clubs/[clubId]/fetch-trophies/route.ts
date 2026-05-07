import { NextResponse } from "next/server";
import { requireRole } from "@/lib/check-permission";
import {
  strictRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { getLeagueStandings, getCupFinalFixtures } from "@/lib/api-football";

const LIGUE1_API_ID = 61;
const LIGUE1_COUNTRY = "France";
const MIN_YEAR = 2022;
const MAX_YEAR = 2024;

const CUP_COMPETITIONS: { apiId: number; name: string; country: string; roundFilter: string | null }[] = [
  { apiId: 66,  name: "Coupe de France",        country: "France", roundFilter: "Final" },
  { apiId: 526, name: "Trophée des Champions",  country: "France", roundFilter: null },
  { apiId: 2,   name: "UEFA Champions League",  country: "World",  roundFilter: "Final" },
  { apiId: 3,   name: "UEFA Europa League",     country: "World",  roundFilter: "Final" },
];

function seasonToYear(season: string): number | null {
  const match = season.match(/^(\d{4})-\d{2}$/);
  return match ? parseInt(match[1], 10) : null;
}

function yearToSeason(year: number): string {
  return `${year}-${String(year + 1).slice(2)}`;
}

function getTeamPlace(
  fixture: { teams: { home: { id: number; winner: boolean | null }; away: { id: number; winner: boolean | null } } },
  teamId: number
): "Winner" | "Finalist" | null {
  const { home, away } = fixture.teams;
  if (home.id === teamId) return home.winner === true ? "Winner" : home.winner === false ? "Finalist" : null;
  if (away.id === teamId) return away.winner === true ? "Winner" : away.winner === false ? "Finalist" : null;
  return null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { error, session } = await requireRole(["superadmin"]);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(strictRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const { clubId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, apiFootballTeamId: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 404 });
    }

    if (!club.apiFootballTeamId) {
      return NextResponse.json(
        { error: "Ce club n'a pas d'ID API-Football. Lancez d'abord le script de matching." },
        { status: 422 }
      );
    }

    const jerseys = await prisma.jersey.findMany({
      where: { clubId },
      select: { season: true },
      distinct: ["season"],
    });

    const years = [...new Set(
      jerseys
        .map((j) => seasonToYear(j.season))
        .filter((y): y is number => y !== null && y >= MIN_YEAR && y <= MAX_YEAR)
    )];

    if (years.length === 0) {
      return NextResponse.json({ count: 0, message: "Aucune saison accessible (2022-2024) trouvée pour ce club" });
    }

    let count = 0;

    for (const year of years) {
      const season = yearToSeason(year);

      // Championnat
      const standings = await getLeagueStandings(LIGUE1_API_ID, year);
      const leagueWinner = standings.find((e) => e.rank === 1);
      if (leagueWinner?.team.id === club.apiFootballTeamId) {
        await prisma.clubTrophy.upsert({
          where: { clubId_competition_season_place: { clubId: club.id, competition: "Ligue 1", season, place: "Winner" } },
          update: { fetchedAt: new Date() },
          create: { clubId: club.id, competition: "Ligue 1", country: LIGUE1_COUNTRY, season, place: "Winner" },
        });
        count++;
      }

      // Coupes
      for (const cup of CUP_COMPETITIONS) {
        const fixtures = await getCupFinalFixtures(cup.apiId, year, cup.roundFilter);
        const final = fixtures[0];
        if (!final) continue;

        const place = getTeamPlace(final, club.apiFootballTeamId);
        if (!place) continue;

        await prisma.clubTrophy.upsert({
          where: { clubId_competition_season_place: { clubId: club.id, competition: cup.name, season, place } },
          update: { fetchedAt: new Date() },
          create: { clubId: club.id, competition: cup.name, country: cup.country, season, place },
        });
        count++;
      }
    }

    return NextResponse.json({ count });
  } catch (err) {
    console.error("POST /api/admin/clubs/[clubId]/fetch-trophies error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
