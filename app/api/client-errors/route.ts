import { NextResponse } from "next/server";
import { z } from "zod";
import { clientErrorsRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { recordErrorEvent } from "@/lib/report-error";
import { CONTEXT_MAX, MESSAGE_MAX, STACK_MAX } from "@/lib/error-events";

const MAX_BODY_BYTES = 16 * 1024;

const clientErrorSchema = z.object({
  context: z.string().max(CONTEXT_MAX).regex(/^ios\.[a-z0-9._-]+$/),
  message: z.string().min(1).max(MESSAGE_MAX * 2),
  stack: z.string().max(STACK_MAX).nullish(),
});

/**
 * Erreurs remontées par l'app iOS. Publique : un crash peut survenir avant la
 * connexion. Aucun identifiant de compte n'est lu ni stocké (label App Store
 * « non liées à l'identité ») ; la source est forcée à IOS.
 */
export async function POST(request: Request) {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(clientErrorsRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Requête trop volumineuse" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const parsed = clientErrorSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    await recordErrorEvent({
      source: "IOS",
      context: parsed.data.context,
      message: parsed.data.message,
      stack: parsed.data.stack ?? null,
      appVersion: request.headers.get("x-app-version"),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[client-errors]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
