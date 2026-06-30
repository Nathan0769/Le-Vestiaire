"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    if (loading || !user) return;

    const intent = parsePendingIntent(new URLSearchParams(searchParams.toString()));
    if (intent !== expectedIntent) return;

    hasTriggered.current = true;
    onTrigger();

    trackEvent({
      name: "auth_intent_resolved",
      params: { intent: expectedIntent, jersey_id: jerseyId },
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("intent");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [loading, user, searchParams, expectedIntent, jerseyId, onTrigger, pathname, router]);
}
