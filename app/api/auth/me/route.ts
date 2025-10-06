import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json(null, { status: 200 });

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true,
      username: true,
      accounts: {
        select: {
          providerId: true,
          password: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json(null, { status: 200 });

  let avatarUrl = null;
  if (user.avatar) {
    const { data } = await supabaseAdmin.storage
      .from("avatar")
      .createSignedUrl(user.avatar, 60 * 60);

    avatarUrl = data?.signedUrl || null;
  }

  const hasGoogleAccount = user.accounts.some(
    (account) => account.providerId === "google"
  );
  const hasPasswordAccount = user.accounts.some(
    (account) => account.password !== null
  );

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    avatarUrl,
    createdAt: user.createdAt.toISOString(),
    username: user.username,
    authProvider: {
      hasGoogle: hasGoogleAccount,
      hasPassword: hasPasswordAccount,
      isGoogleOnly: hasGoogleAccount && !hasPasswordAccount,
    },
  });
}
