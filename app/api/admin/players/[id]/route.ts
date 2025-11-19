import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PlayerPosition, Prisma } from "@prisma/client";

const updatePlayerSchema = z.object({
  name: z.string().min(1, "Le nom du joueur est requis").optional(),
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await requirePermission({ proposal: ["approve"] });
  if (error) return error;

  try {
    const body = await request.json();

    const validation = updatePlayerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingPlayer = await prisma.seasonPlayer.findUnique({
      where: { id },
    });

    if (!existingPlayer) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    if (
      validation.data.number !== undefined &&
      validation.data.number !== existingPlayer.number
    ) {
      const conflictingPlayer = await prisma.seasonPlayer.findFirst({
        where: {
          clubId: existingPlayer.clubId,
          season: existingPlayer.season,
          number: validation.data.number,
          id: { not: id },
        },
      });

      if (conflictingPlayer) {
        return NextResponse.json(
          {
            error: `Le numéro ${validation.data.number} est déjà attribué à un autre joueur`,
          },
          { status: 409 }
        );
      }
    }

    const updateData: Prisma.SeasonPlayerUpdateInput = {};

    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }
    if (validation.data.number !== undefined) {
      updateData.number = validation.data.number;
    }
    if (validation.data.position !== undefined) {
      updateData.position = validation.data.position as PlayerPosition | null;
    }
    if (validation.data.photoUrl !== undefined) {
      updateData.photoUrl = validation.data.photoUrl;
    }
    if (validation.data.goals !== undefined) {
      updateData.goals = validation.data.goals;
    }
    if (validation.data.assists !== undefined) {
      updateData.assists = validation.data.assists;
    }
    if (validation.data.matches !== undefined) {
      updateData.matches = validation.data.matches;
    }
    if (validation.data.cleanSheets !== undefined) {
      updateData.cleanSheets = validation.data.cleanSheets;
    }
    if (validation.data.goalsConceded !== undefined) {
      updateData.goalsConceded = validation.data.goalsConceded;
    }

    const updatedPlayer = await prisma.seasonPlayer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedPlayer);
  } catch (err) {
    console.error("Erreur lors de la mise à jour du joueur:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du joueur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await requirePermission({ proposal: ["reject"] });
  if (error) return error;

  try {
    const existingPlayer = await prisma.seasonPlayer.findUnique({
      where: { id },
    });

    if (!existingPlayer) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    await prisma.seasonPlayer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Joueur supprimé avec succès",
    });
  } catch (err) {
    console.error("Erreur lors de la suppression du joueur:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du joueur" },
      { status: 500 }
    );
  }
}
