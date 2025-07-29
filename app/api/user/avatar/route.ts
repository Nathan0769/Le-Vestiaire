import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { avatar: avatarFilePath } = await req.json();

  if (!avatarFilePath) {
    return NextResponse.json(
      { error: "Chemin avatar manquant" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatar: avatarFilePath },
  });

  return NextResponse.json({ success: true });
}
