import { createHash } from "crypto";

export type ErrorSourceName = "SERVER" | "IOS";

export const MESSAGE_MAX = 500;
export const STACK_MAX = 8000;
export const CONTEXT_MAX = 64;

/**
 * Retire ce qui identifie une personne ou donne un accès avant stockage :
 * la table est lisible en admin et l'App Store la déclare « non liée à l'identité ».
 */
export function redactSensitive(text: string): string {
  return text
    .replace(/Bearer\s+[^\s"',]+/g, "Bearer [token]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[token]");
}

/** Ids et nombres variables remplacés : la même erreur forme un seul groupe. */
function normalizeForFingerprint(message: string): string {
  return redactSensitive(message)
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    .replace(/\b[a-z0-9]{20,}\b/gi, "<id>")
    .replace(/\d+/g, "<n>");
}

export function errorFingerprint(input: {
  source: ErrorSourceName;
  context: string;
  message: string;
  appVersion: string | null;
}): string {
  return createHash("sha256")
    .update(
      [input.source, input.context, normalizeForFingerprint(input.message), input.appVersion ?? ""].join("|")
    )
    .digest("hex");
}

export function toErrorParts(error: unknown): { message: string; stack: string | null } {
  if (error instanceof Error) {
    return { message: `${error.name}: ${error.message}`, stack: error.stack ?? null };
  }
  if (typeof error === "string") return { message: error, stack: null };
  try {
    return { message: JSON.stringify(error) ?? String(error), stack: null };
  } catch {
    return { message: String(error), stack: null };
  }
}

export interface ErrorEventInput {
  source: ErrorSourceName;
  context: string;
  message: string;
  stack: string | null;
  appVersion: string | null;
}

/** Ligne prête à stocker : rédigée, tronquée, avec son fingerprint. */
export function buildErrorEvent(input: ErrorEventInput) {
  const context = input.context.slice(0, CONTEXT_MAX);
  const message = redactSensitive(input.message).slice(0, MESSAGE_MAX);
  const stack = input.stack ? redactSensitive(input.stack).slice(0, STACK_MAX) : null;
  const appVersion = input.appVersion?.slice(0, 20) || null;
  return {
    source: input.source,
    context,
    message,
    stack,
    appVersion,
    fingerprint: errorFingerprint({ source: input.source, context, message: input.message, appVersion }),
  };
}
