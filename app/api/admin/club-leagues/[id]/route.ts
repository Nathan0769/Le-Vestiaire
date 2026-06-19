import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.clubSeasonLeague.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
    }
    console.error("DELETE admin club-leagues error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
