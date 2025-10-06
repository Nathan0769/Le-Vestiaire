"use client";

import { useState, useEffect } from "react";

export function useFriendsCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendsCount = async () => {
      try {
        const res = await fetch("/api/friends");
        if (res.ok) {
          const data = await res.json();
          setCount(data.friends?.length || 0);
        }
      } catch (error) {
        console.error("Erreur chargement amis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsCount();
  }, []);

  return { count, loading };
}
