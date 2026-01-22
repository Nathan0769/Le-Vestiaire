"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function usePendingRequestsCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const user = useCurrentUser();
  const etagRef = useRef<string | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/pending", {
        headers: etagRef.current ? { "If-None-Match": etagRef.current } : undefined,
      });

      if (res.status === 304) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const newEtag = res.headers.get("ETag");
        if (newEtag) etagRef.current = newEtag;
        setCount(
          typeof data.pendingCount === "number"
            ? data.pendingCount
            : data.requests?.length || 0
        );
      }
    } catch (error) {
      console.error("Erreur chargement demandes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setCount(0);
      return;
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30 * 60 * 1000);

    const channel = supabase.channel(`friendship:${user.id}`);
    channel.on("broadcast", { event: "friendship:update" }, () => {
      fetchCount();
    });
    channel.subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchCount]);

  return { count, loading, refetch: fetchCount };
}
