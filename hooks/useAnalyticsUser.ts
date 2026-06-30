"use client";

import { useEffect } from "react";
import { setAnalyticsUserId, clearAnalyticsUserId } from "@/lib/analytics";

export function useAnalyticsUser(userId: string | null, loading: boolean): void {
  useEffect(() => {
    if (loading) return;
    if (userId) {
      setAnalyticsUserId(userId);
    } else {
      clearAnalyticsUserId();
    }
  }, [userId, loading]);
}
