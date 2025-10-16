import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    if (friendship.receiverId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (friendship.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette demande n'est pas en attente" },
        { status: 400 }
      );
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        updatedAt: new Date(),
      },
    });

    try {
      const channel = supabaseAdmin.channel(`friendship:${updated.senderId}`);
      await channel.send({
        type: "broadcast",
        event: "friendship:update",
        payload: { kind: "PENDING_ACCEPTED", id: updated.id },
      });
      await supabaseAdmin.removeChannel(channel);
    } catch {
      // ignore realtime errors
    }

    return NextResponse.json({
      success: true,
      message: "Demande acceptée",
      friendship: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Erreur accept:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
