import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";

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
    if (authorizationHeader?.startsWith("Bearer ")) {
      const session = await auth.api.getSession({
        headers: new Headers({
          Authorization: authorizationHeader,
        }),
      });
      return session?.user ?? null;
    }

    // Fallback : cookies (client web)
    const cookieStore = await cookies();
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieStore.toString(),
      }),
    });

    return session?.user ?? null;
  } catch (error) {
    console.error("❌ Direct auth error:", error);
    return null;
  }
}
