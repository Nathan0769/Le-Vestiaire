import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PlayerPosition } from "@prisma/client";

const createPlayerSchema = z.object({
  clubId: z.string().min(1, "L'ID du club est requis"),
  season: z.string().min(1, "La saison est requise"),
  name: z.string().min(1, "Le nom du joueur est requis"),
  number: z.number().int().positive().optional().nullable(),
  position: z
    .enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"])
    .optional()
    .nullable(),
  photoUrl: z.string().url().optional().nullable(),
  goals: z.number().int().min(0).optional().nullable(),
  assists: z.number().int().min(0).optional().nullable(),
  matches: z.number().int().min(0).optional().nullable(),
  cleanSheets: z.number().int().min(0).optional().nullable(),
  goalsConceded: z.number().int().min(0).optional().nullable(),
});

export async function GET(request: Request) {
  const { error } = await requirePermission({ proposal: ["list"] });
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const season = searchParams.get("season");

    if (!clubId || !season) {
      return NextResponse.json(
        { error: "Les paramètres clubId et season sont requis" },
        { status: 400 }
      );
    }

    const players = await prisma.seasonPlayer.findMany({
      where: {
        clubId,
        season,
      },
      orderBy: [{ number: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error("Erreur lors du chargement des joueurs:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des joueurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error } = await requirePermission({ proposal: ["approve"] });
  if (error) return error;

  try {
    const body = await request.json();

    const validation = createPlayerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      clubId,
      season,
      name,
      number,
      position,
      photoUrl,
      goals,
      assists,
      matches,
      cleanSheets,
      goalsConceded,
    } = validation.data;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "Club non trouvé" }, { status: 404 });
    }

    if (number) {
      const existingPlayer = await prisma.seasonPlayer.findFirst({
        where: {
          clubId,
          season,
          number,
        },
      });

      if (existingPlayer) {
        return NextResponse.json(
          {
            error: `Un joueur avec le numéro ${number} existe déjà pour ${club.name} saison ${season}`,
          },
          { status: 409 }
        );
      }
    }

    const player = await prisma.seasonPlayer.create({
      data: {
        clubId,
        season,
        name,
        number: number ?? null,
        position: (position as PlayerPosition | null) ?? null,
        photoUrl: photoUrl ?? null,
        goals: goals ?? null,
        assists: assists ?? null,
        matches: matches ?? null,
        cleanSheets: cleanSheets ?? null,
        goalsConceded: goalsConceded ?? null,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    console.error("Erreur lors de la création du joueur:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du joueur" },
      { status: 500 }
    );
  }
}
