"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function usePendingRequestsCount() {
  const [count, setCount] = useState<number>(0);
  const [etag, setEtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useCurrentUser();

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/friends/pending", {
        headers: etag ? { "If-None-Match": etag } : undefined,
      });

      if (res.status === 304) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const newEtag = res.headers.get("ETag");
        if (newEtag) setEtag(newEtag);
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
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 120000);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (user?.id) {
      channel = supabase.channel(`friendship:${user.id}`);
      channel.on("broadcast", { event: "friendship:update" }, () => {
        fetchCount();
      });
      channel.subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { count, loading, refetch: fetchCount };
}
