import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";
import { isSupporter } from "@/lib/subscription";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json(null, { status: 200 });

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      avatar: true,
      createdAt: true,
      username: true,
      role: true,
      plan: true,
      avatarFrame: true,
      profileBanner: true,
      accounts: {
        select: {
          providerId: true,
        },
      },
      _count: { select: { collection: true } },
    },
  });

  if (!user) return NextResponse.json(null, { status: 200 });

  let avatarUrl = null;
  if (user.avatar) {
    avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, user.avatar, 60 * 60);
  }

  const hasGoogleAccount = user.accounts.some(
    (account) => account.providerId === "google"
  );
  const hasPasswordAccount = user.accounts.some(
    (account) => account.providerId === "credential"
  );

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: avatarUrl ?? user.image ?? null,
    avatar: user.avatar,
    avatarUrl,
    createdAt: user.createdAt.toISOString(),
    username: user.username,
    role: user.role,
    isSupporter: isSupporter(user),
    avatarFrame: user.avatarFrame,
    profileBanner: user.profileBanner,
    jerseyCount: user._count.collection,
    authProvider: {
      hasGoogle: hasGoogleAccount,
      hasPassword: hasPasswordAccount,
      isGoogleOnly: hasGoogleAccount && !hasPasswordAccount,
    },
  });
}
