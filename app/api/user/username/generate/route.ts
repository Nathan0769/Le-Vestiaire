import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/username-generator";
import { getCurrentUser } from "@/lib/get-current-user";

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let providedName: string | undefined;
    try {
      const body = await request.json();
      providedName = body?.name;
    } catch {}

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { username: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (user.username && user.username !== "") {
      return NextResponse.json({
        success: true,
        username: user.username,
        message: "Username déjà existant",
      });
    }

    const baseName = providedName || user.name || user.email || "user";
    const username = await generateUniqueUsername(baseName);

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { username },
    });

    console.log(`✅ Username généré pour ${sessionUser.id}: ${username}`);

    return NextResponse.json({
      success: true,
      username,
    });
  } catch (error) {
    console.error("❌ Erreur génération username:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
