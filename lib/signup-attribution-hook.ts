import { getOAuthState } from "better-auth/api";
import {
  SIGNUP_CONTEXT_HEADER,
  buildSignupAttribution,
  parseSignupContext,
  type SignupAttributionData,
  type SignupContext,
} from "@/lib/signup-attribution";

/** Ce que le hook lit du contexte d'endpoint Better Auth (sous-ensemble typé). */
export type AuthHookContext = {
  path?: string;
  headers?: Headers;
  params?: Record<string, string | undefined>;
  body?: unknown;
};

export type SignupAttributionDeps = {
  readOAuthState: () => Promise<Record<string, unknown> | null>;
  save: (userId: string, data: SignupAttributionData) => Promise<void>;
  siteHost: string;
};

// Imports dynamiques : les tests unit injectent leurs deps sans charger Prisma
const defaultDeps: SignupAttributionDeps = {
  readOAuthState: async () => (await getOAuthState()) as Record<string, unknown> | null,
  async save(userId, data) {
    const { default: prisma } = await import("@/lib/prisma");
    await prisma.signupAttribution.create({ data: { userId, ...data } });
  },
  siteHost: siteHostFromEnv(),
};

function siteHostFromEnv(): string {
  try {
    return new URL(process.env.BETTER_AUTH_URL ?? "").hostname;
  } catch {
    return "le-vestiaire-foot.fr";
  }
}

// Même objet de contexte passé aux hooks before et after d'une création
const pending = new WeakMap<object, SignupAttributionData>();

function providerOf(ctx: AuthHookContext): string | null {
  if (ctx.params?.id) return ctx.params.id;
  const body = ctx.body as { provider?: unknown } | undefined;
  return typeof body?.provider === "string" ? body.provider : null;
}

/**
 * Hook `user.create.before` : lit le contexte d'inscription pendant la requête
 * (en-tête pour l'email, `additionalData` de l'état OAuth pour Google). Le hook
 * `after` tourne après le commit, on garde donc le résultat jusque-là.
 */
export async function captureSignupAttribution(
  ctx: AuthHookContext | null,
  deps: SignupAttributionDeps = defaultDeps
): Promise<void> {
  if (!ctx) return;
  try {
    const fromHeader = parseSignupContext(ctx.headers?.get(SIGNUP_CONTEXT_HEADER));
    const oauthState = await deps.readOAuthState().catch(() => null);
    const fromOAuth = parseSignupContext(oauthState?.signupContext);
    const context: SignupContext = { ...fromHeader, ...fromOAuth };
    pending.set(
      ctx,
      buildSignupAttribution({
        headers: ctx.headers,
        path: ctx.path,
        provider: providerOf(ctx),
        context,
        siteHost: deps.siteHost,
      })
    );
  } catch {
    // Volontairement ignoré : une source manquante ne doit jamais bloquer une inscription
  }
}

/** Hook `user.create.after` : écrit la ligne. Ne lève jamais. */
export async function saveSignupAttribution(
  userId: string,
  ctx: AuthHookContext | null,
  deps: SignupAttributionDeps = defaultDeps
): Promise<void> {
  if (!ctx) return;
  const data = pending.get(ctx);
  pending.delete(ctx);
  if (!data) return;
  try {
    await deps.save(userId, data);
  } catch (error) {
    console.error("Source d'inscription non enregistrée:", error);
  }
}
