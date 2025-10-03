import { NextRequest, NextResponse } from "next/server";
import { usernameExists, validateUsername } from "@/lib/username-generator";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username manquant" }, { status: 400 });
  }

  const validation = validateUsername(username);
  if (!validation.valid) {
    return NextResponse.json({
      available: false,
      error: validation.error,
    });
  }

  const exists = await usernameExists(username);

  return NextResponse.json({
    available: !exists,
    username,
  });
}
