import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { AuthGateBanner } from "@/components/auth/auth-gate-banner";
import { BackButton } from "@/components/ui/back-button";
import { FollowButton } from "@/components/follow/follow-button";
import type { FollowState } from "@/types/follow";

interface PrivateProfileScreenProps {
  targetUserId: string;
  displayName: string;
  isAnonymous: boolean;
  currentUserId: string | null;
}

/**
 * Affiché à la place de la collection, de la wishlist et des succès d'un
 * compte privé pour qui ne le suit pas. Seul le bouton suivre reste proposé
 * (il envoie une demande, acceptée ou non par le propriétaire).
 */
export async function PrivateProfileScreen({
  targetUserId,
  displayName,
  isAnonymous,
  currentUserId,
}: PrivateProfileScreenProps) {
  const t = await getTranslations("PublicCollection");

  let followState: FollowState = "none";
  if (currentUserId) {
    const request = await prisma.followRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: currentUserId,
          targetId: targetUserId,
        },
      },
      select: { id: true },
    });
    if (request) followState = "requested";
  }

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      {!currentUserId && <AuthGateBanner />}

      <div className="flex items-center gap-4">
        <BackButton href="/leaderboard" />
        <h1 className="text-2xl font-semibold truncate min-w-0">
          {displayName}
        </h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">{t("privateTitle")}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("privateMessage")}
        </p>
        {currentUserId && !isAnonymous && (
          <div className="mt-2">
            <FollowButton
              targetUserId={targetUserId}
              initialState={followState}
              source="profile"
            />
          </div>
        )}
      </div>
    </div>
  );
}
