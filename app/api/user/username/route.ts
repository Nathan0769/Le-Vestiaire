import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { validateUsername, usernameExists } from "@/lib/username-generator";
import {
  standardRateLimit,
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    });

    return NextResponse.json({ username: dbUser?.username ?? "" });
  } catch (error) {
    console.error("Error fetching username:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let username: unknown;
  try {
    const body = await request.json();
    username = body?.username;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (typeof username !== "string") {
    return NextResponse.json({ error: "Username invalide" }, { status: 400 });
  }

  try {
    const validation = validateUsername(username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    });

    if (
      currentUser?.username &&
      currentUser.username.toLowerCase() === username.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "C'est déjà votre pseudo actuel" },
        { status: 400 }
      );
    }

    const exists = await usernameExists(username);
    if (exists) {
      return NextResponse.json(
        { error: "Ce pseudo est déjà pris" },
        { status: 409 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Error updating username:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
