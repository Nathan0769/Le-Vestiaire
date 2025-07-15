// hooks/useAuth.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthUser, AuthContextValue } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading) {
      if (session?.user) {
        const { id, email, name } = session.user;
        setUser({ id, email, name });
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [session, sessionLoading]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    await authClient.signIn.email({ email, password });
    router.push("/");
  };

  const signUp = async (email: string, password: string, name: string = "") => {
    setLoading(true);
    await authClient.signUp.email({ email, password, name });
    router.push("/");
  };

  const sendMagicLink = async (email: string) => {
    await authClient.requestPasswordReset({
      email,
      redirectTo: window.location.origin + "/auth/callback",
    });
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, sendMagicLink, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
