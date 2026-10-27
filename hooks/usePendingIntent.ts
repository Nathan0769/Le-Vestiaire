"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parsePendingIntent, type AuthGateIntent } from "@/lib/auth-gate";
import { trackEvent } from "@/lib/analytics";

interface UsePendingIntentArgs {
  intent: AuthGateIntent;
  jerseyId: string;
  onTrigger: () => void;
}

export function usePendingIntent({
  intent: expectedIntent,
  jerseyId,
  onTrigger,
}: UsePendingIntentArgs): void {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    if (loading || !user) return;

    // Lu dans l'effet plutot que via useSearchParams : ce hook vit sur la fiche
    // maillot rendue en cache, ou useSearchParams hors Suspense casse le rendu.
    const params = new URLSearchParams(window.location.search);
    const intent = parsePendingIntent(params);
    if (intent !== expectedIntent) return;

    hasTriggered.current = true;
    onTrigger();

    trackEvent({
      name: "auth_intent_resolved",
      params: { intent: expectedIntent, jersey_id: jerseyId },
    });

    params.delete("intent");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [loading, user, expectedIntent, jerseyId, onTrigger, pathname, router]);
}
