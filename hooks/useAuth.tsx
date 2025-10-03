"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
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
  const hasAttemptedUsernameGeneration = useRef(false);

  useEffect(() => {
    if (!sessionLoading) {
      setUser(session?.user ?? null);
      setLoading(false);
    }
  }, [session, sessionLoading]);

  useEffect(() => {
    const maybeGenerateUsername = async () => {
      if (hasAttemptedUsernameGeneration.current) return;
      if (!session?.user?.id) return;

      hasAttemptedUsernameGeneration.current = true;
      try {
        const res = await fetch("/api/user/username/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: session.user.name || session.user.email,
          }),
        });
        if (res.ok && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("username-generated"));
        }
      } catch (err) {
        console.error("Erreur génération username post-auth:", err);
      }
    };

    if (!sessionLoading) {
      void maybeGenerateUsername();
    }
  }, [
    sessionLoading,
    session?.user?.id,
    session?.user?.name,
    session?.user?.email,
  ]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message);
      router.push("/");
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error, data } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/auth/login",
      });

      if (error) throw new Error(error.message);

      if (data && "user" in data && data.user?.id) {
        try {
          const res = await fetch("/api/user/username/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.user.name || data.user.email,
            }),
          });
          if (res.ok && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("username-generated"));
          }
        } catch (err) {
          console.error("Erreur génération username:", err);
        }
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const { error, data } = await authClient.signUp.email({
        email,
        password,
        name: username,
      });

      if (error) throw new Error(error.message);

      if (data?.user?.id) {
        try {
          await fetch("/api/user/username/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              name: username,
            }),
          });
        } catch (err) {
          console.error("Erreur génération username:", err);
        }
      }

      router.push("/");
    } catch (error) {
      setLoading(false);
      throw error;
    }
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
