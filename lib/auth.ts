import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin as adminPlugin, lastLoginMethod, bearer } from "better-auth/plugins";
import { render } from "@react-email/components";
import prisma from "./prisma";
import { resend, FROM_EMAIL, APP_URL } from "./email";
import { ResetPasswordEmail } from "@/emails/reset-password";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Seuls nos domaines officiels sont autorisés comme redirectTo
      const allowedOrigins = [APP_URL, "levestiaire://"];
      const isAllowed = allowedOrigins.some((origin) => url.startsWith(origin));
      if (!isAllowed) return;

      const html = await render(ResetPasswordEmail({ url }));
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html,
      });
    },
  },
  magicLink: {
    enabled: false,
    redirectTo: process.env.NEXT_PUBLIC_BASE_URL! + "/auth/callback",
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    adminPlugin({
      defaultRole: "user", // Rôle par défaut pour les nouveaux utilisateurs
      impersonationSessionDuration: 60 * 60, // 1 heure (en secondes)
    }),
    lastLoginMethod({
      storeInDatabase: true,
      maxAge: 2592000, // 30 jours
    }),
    // Permet aux clients mobiles d'utiliser Authorization: Bearer <token>
    bearer(),
  ],
  trustedOrigins: [
    "levestiaire://",
    "exp+le-vestiaire-mobile://",
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  url: process.env.BETTER_AUTH_URL!,
});
