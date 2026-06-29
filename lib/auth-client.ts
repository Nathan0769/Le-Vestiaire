import { createAuthClient } from "better-auth/react";
import { adminClient, lastLoginMethodClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [adminClient(), lastLoginMethodClient()],
});

export const handleGoogleSignIn = async (returnTo?: string) => {
  const callbackURL = returnTo
    ? `/auth/onboarding?returnTo=${encodeURIComponent(returnTo)}`
    : undefined;
  const { error } = await authClient.signIn.social({
    provider: "google",
    ...(callbackURL ? { callbackURL } : {}),
  });
  if (error) console.error(error);
};
