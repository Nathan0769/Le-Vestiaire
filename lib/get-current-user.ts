import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordUserActivity, type ActivityPlatform } from "@/lib/user-activity";
import { cookies, headers } from "next/headers";
import { after } from "next/server";

// after() garantit que l'écriture se termine sur Vercel sans retarder la réponse
function trackActivity(userId: string, platform: ActivityPlatform) {
  try {
    after(() => recordUserActivity(userId, platform));
  } catch {
    // Hors contexte de requête (script, build) : rien à suivre
  }
}

/**
 * Récupère l'utilisateur courant depuis la session.
 *
 * Supporte deux modes en parallèle :
 * - Web : session via cookies HTTP-only
 * - Mobile : session via Authorization: Bearer <token>
 *
 * Le plugin `bearer` dans lib/auth.ts convertit automatiquement
 * le Bearer token en lookup de session côté Better Auth.
 */
export async function getCurrentUser() {
  try {
    const requestHeaders = await headers();
    const authorizationHeader = requestHeaders.get("Authorization");

    // Priorité au Bearer token (client mobile)
    // Lookup direct Prisma — le bearer() plugin de Better Auth a un bug HMAC en prod
    if (authorizationHeader?.startsWith("Bearer ")) {
      const rawToken = authorizationHeader.slice(7).trim();
      const session = await prisma.session.findUnique({
        where: { token: rawToken },
        include: { user: true },
      });
      if (!session || session.expiresAt < new Date()) return null;
      // Seule l'app iOS s'authentifie en Bearer
      trackActivity(session.user.id, "ios");
      return session.user;
    }

    // Fallback : cookies (client web)
    const cookieStore = await cookies();
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieStore.toString(),
      }),
    });

    if (session?.user) trackActivity(session.user.id, "web");
    return session?.user ?? null;
  } catch (error) {
    console.error("❌ Direct auth error:", error);
    return null;
  }
}
