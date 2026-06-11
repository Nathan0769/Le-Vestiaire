import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

const avatarSchema = z.object({
  avatar: z.string().min(1).max(500),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = avatarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatar: parsed.data.avatar },
  });

  return NextResponse.json({ success: true });
}
