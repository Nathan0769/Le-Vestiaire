"use client";

import { useState, useEffect } from "react";

export function usePendingRequestsCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/friends/pending");
      if (res.ok) {
        const data = await res.json();
        setCount(data.requests?.length || 0);
      }
    } catch (error) {
      console.error("Erreur chargement demandes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    const interval = setInterval(fetchCount, 60000);

    return () => clearInterval(interval);
  }, []);

  return { count, loading, refetch: fetchCount };
}
