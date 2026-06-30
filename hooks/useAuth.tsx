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
import { useAnalyticsUser } from "@/hooks/useAnalyticsUser";
import { trackEvent } from "@/lib/analytics";
import { parsePendingIntent } from "@/lib/auth-gate";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ANALYTICS_AUTH_FIRED_KEY = "analytics_auth_fired";

function hasIntentContextFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (parsePendingIntent(params)) return true;
  const returnTo = params.get("returnTo");
  if (!returnTo) return false;
  try {
    const url = new URL(returnTo, window.location.origin);
    return parsePendingIntent(url.searchParams) !== null;
  } catch {
    return false;
  }
}

function resolveProvider(): "google" | "email" {
  const last = authClient.getLastUsedLoginMethod();
  return last === "google" ? "google" : "email";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hasAttemptedUsernameGeneration = useRef(false);

  useAnalyticsUser(user?.id ?? null, loading);

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
        if (!res.ok) return;

        const data = (await res.json()) as { isNewUser?: boolean };
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("username-generated"));
        }

        const alreadyFired =
          typeof window !== "undefined" &&
          window.sessionStorage.getItem(ANALYTICS_AUTH_FIRED_KEY);
        if (alreadyFired) return;

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(ANALYTICS_AUTH_FIRED_KEY, "1");
        }

        const provider = resolveProvider();
        if (data.isNewUser) {
          trackEvent({
            name: "sign_up",
            params: { provider, has_intent_context: hasIntentContextFromUrl() },
          });
        } else {
          trackEvent({ name: "login", params: { provider } });
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

  const buildOnboardingUrl = (returnTo?: string) =>
    returnTo
      ? `/auth/onboarding?returnTo=${encodeURIComponent(returnTo)}`
      : "/auth/onboarding";

  const signIn = async (email: string, password: string, returnTo?: string) => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message);
      router.push(buildOnboardingUrl(returnTo));
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async (returnTo?: string) => {
    setLoading(true);
    try {
      const { error, data } = await authClient.signIn.social({
        provider: "google",
        callbackURL: buildOnboardingUrl(returnTo),
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

  const signUp = async (email: string, password: string, returnTo?: string) => {
    setLoading(true);
    try {
      const { error, data } = await authClient.signUp.email({
        email,
        password,
        name: email.split("@")[0],
      });

      if (error) throw new Error(error.message);

      if (data?.user?.id) {
        try {
          await fetch("/api/user/username/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
        } catch (err) {
          console.error("Erreur génération username:", err);
        }
      }

      router.push(buildOnboardingUrl(returnTo));
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
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ANALYTICS_AUTH_FIRED_KEY);
    }
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
