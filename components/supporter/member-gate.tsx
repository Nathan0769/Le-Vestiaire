"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MemberArea } from "@/components/supporter/member-area";

/**
 * Sur /soutien : un supporter connecté voit son espace membre (sa carte),
 * tout le monde d'autre voit les tarifs (children). Détection côté client
 * pour garder la page statique et SEO-friendly pour les visiteurs.
 */
export function MemberGate({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();

  if (user?.isSupporter) {
    return (
      <MemberArea
        name={user.username ?? user.name ?? "Membre"}
        userId={user.id}
        jerseyCount={user.jerseyCount}
        since={new Date(user.createdAt).getFullYear()}
      />
    );
  }

  return <>{children}</>;
}
