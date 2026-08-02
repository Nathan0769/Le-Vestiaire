import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

// Reponse liee a la session (email, role, avatar presigne) : ne doit jamais
// etre mise en cache par le navigateur ou un proxy intermediaire, sinon risque
// de servir les donnees d'un compte a un autre sur un appareil partage.
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser)
    return NextResponse.json(null, { status: 200, headers: NO_STORE_HEADERS });

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
      accounts: {
        select: {
          providerId: true,
        },
      },
    },
  });

  if (!user)
    return NextResponse.json(null, { status: 200, headers: NO_STORE_HEADERS });

  let avatarUrl = null;
  if (user.avatar) {
    // TTL 4h : couvre un onglet laisse ouvert longtemps sans refetch, evite un
    // avatar casse. Faible sensibilite (image de l'utilisateur lui-meme).
    avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, user.avatar, 60 * 60 * 4);
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
    authProvider: {
      hasGoogle: hasGoogleAccount,
      hasPassword: hasPasswordAccount,
      isGoogleOnly: hasGoogleAccount && !hasPasswordAccount,
    },
  }, { headers: NO_STORE_HEADERS });
}
