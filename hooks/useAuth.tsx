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
      setUser(session?.user ?? null);
      setLoading(false);
    }
  }, [session, sessionLoading]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message);
    router.push("/");
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/auth/login",
    });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: username,
    });
    if (error) throw new Error(error.message);
    router.push("/");
  };

  const sendMagicLink = async (email: string) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        sendMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
