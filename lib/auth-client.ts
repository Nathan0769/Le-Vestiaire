import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
});

export const handleGoogleSignIn = async () => {
  const { error } = await authClient.signIn.social({
    provider: "google",
  });
  if (error) console.error(error);
};
