import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { nativeBridgeLocation } from "@/lib/mobile-oauth";

export const dynamic = "force-dynamic";

/**
 * Pont d'authentification native.
 *
 * Après un OAuth social (Google), Better Auth pose le cookie de session puis
 * redirige vers ce endpoint (callbackURL). On lit la session via le cookie et
 * on renvoie le token de session à l'app iOS via le deep link
 * `levestiaire://auth?token=...`, capturé par ASWebAuthenticationSession.
 *
 * Le token de session EST le Bearer token (cf. lib/get-current-user.ts qui
 * fait un lookup direct `prisma.session.findUnique({ where: { token } })`).
 */
export async function GET(request: Request) {
  try {
    const error = new URL(request.url).searchParams.get("error");
    const session = error === null ? await auth.api.getSession({ headers: await headers() }) : null;
    const location = nativeBridgeLocation({ token: session?.session?.token ?? null, error });
    return new NextResponse(null, { status: 302, headers: { Location: location } });
  } catch (error) {
    console.error("native-bridge error:", error);
    return new NextResponse(null, {
      status: 302,
      headers: { Location: "levestiaire://auth?error=server" },
    });
  }
}
