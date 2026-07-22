import { createAuthClient } from "better-auth/react";
import { adminClient, lastLoginMethodClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [adminClient(), lastLoginMethodClient()],
});

export const handleGoogleSignIn = async (returnTo?: string) => {
  // Toujours passer par l'onboarding après OAuth Google : sans callbackURL,
  // Better Auth redirige vers la home et saute la sélection du club favori.
  const callbackURL = returnTo
    ? `/auth/onboarding?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/onboarding";
  const { error } = await authClient.signIn.social({
    provider: "google",
    callbackURL,
  });
  if (error) console.error(error);
};
