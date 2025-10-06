"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  avatarUrl?: string;
  username: string;
  authProvider?: {
    hasGoogle: boolean;
    hasPassword: boolean;
    isGoogleOnly: boolean;
  };
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Erreur chargement utilisateur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return user;
}
