import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const hexSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Format hex invalide (ex: #1a2b3c)")
  .transform((s) => s.toLowerCase());

const bodySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("set"), color: hexSchema }),
  z.object({ mode: z.literal("reset") }),
  z.object({ mode: z.literal("regenerate") }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Accès refusé. Droits superadmin requis." },
        { status: 403 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await request.json();
    const validation = bodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = await params;

    const jersey = await prisma.jersey.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot introuvable" },
        { status: 404 }
      );
    }

    let nextColor: string | null = null;

    if (validation.data.mode === "set") {
      nextColor = validation.data.color;
    } else if (validation.data.mode === "reset") {
      nextColor = null;
    } else {
      // Import dynamique : sharp / node-vibrant ne sont charges que pour la
      // regeneration. Set / reset n ont pas besoin et marchent toujours meme
      // si sharp n est pas dispo sur la plateforme.
      const { extractMainColor } = await import("@/lib/extract-main-color");
      const { color } = await extractMainColor(jersey.imageUrl);
      nextColor = color;
    }

    const updated = await prisma.jersey.update({
      where: { id },
      data: { mainColor: nextColor },
      select: { mainColor: true },
    });

    return NextResponse.json({
      success: true,
      mainColor: updated.mainColor,
    });
  } catch (error) {
    console.error("Error updating jersey main color:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la couleur" },
      { status: 500 }
    );
  }
}
