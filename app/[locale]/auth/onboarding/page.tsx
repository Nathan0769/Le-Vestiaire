import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { OnboardingFavoriteClub } from "@/components/auth/onboarding-favorite-club";

export const metadata: Metadata = {
  title: "Bienvenue - Le Vestiaire Foot",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { favoriteClubId: true, username: true },
  });

  // Si l'équipe favorite est déjà définie, pas besoin de passer par l'onboarding
  if (userProfile?.favoriteClubId) {
    redirect("/");
  }

  return <OnboardingFavoriteClub initialUsername={userProfile?.username ?? ""} />;
}
