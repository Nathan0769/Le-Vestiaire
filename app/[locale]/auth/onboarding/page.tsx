import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { OnboardingFavoriteClub } from "@/components/auth/onboarding-favorite-club";
import { isValidReturnTo } from "@/lib/auth-gate";

export const metadata: Metadata = {
  title: "Bienvenue - Le Vestiaire Foot",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function OnboardingPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  const safeReturnTo = isValidReturnTo(returnTo) ? returnTo : "/";

  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { favoriteClubId: true, username: true },
  });

  if (userProfile?.favoriteClubId) {
    redirect(safeReturnTo);
  }

  return (
    <OnboardingFavoriteClub
      initialUsername={userProfile?.username ?? ""}
      returnTo={safeReturnTo}
    />
  );
}
