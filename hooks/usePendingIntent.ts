"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parsePendingIntent, type AuthGateIntent } from "@/lib/auth-gate";

export function usePendingIntent(
  expectedIntent: AuthGateIntent,
  onTrigger: () => void
): void {
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

    const params = new URLSearchParams(searchParams.toString());
    params.delete("intent");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [loading, user, searchParams, expectedIntent, onTrigger, pathname, router]);
}
