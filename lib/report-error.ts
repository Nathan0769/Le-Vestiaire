import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { buildErrorEvent, toErrorParts, type ErrorEventInput } from "@/lib/error-events";

/**
 * Enregistre une occurrence. Upsert atomique sur le fingerprint : deux
 * occurrences simultanées ne créent pas deux lignes. Une erreur marquée
 * résolue qui revient est rouverte et repart dans le prochain digest.
 */
export async function recordErrorEvent(input: ErrorEventInput): Promise<void> {
  const e = buildErrorEvent(input);
  await prisma.$executeRaw`
    INSERT INTO "error_events" ("id", "fingerprint", "source", "context", "message", "stack", "app_version")
    VALUES (${randomUUID()}, ${e.fingerprint}, ${e.source}::"ErrorSource", ${e.context}, ${e.message}, ${e.stack}, ${e.appVersion})
    ON CONFLICT ("fingerprint") DO UPDATE SET
      "count" = "error_events"."count" + 1,
      "last_seen_at" = CURRENT_TIMESTAMP,
      "message" = EXCLUDED."message",
      "stack" = COALESCE(EXCLUDED."stack", "error_events"."stack"),
      "notified_at" = CASE WHEN "error_events"."resolved_at" IS NULL THEN "error_events"."notified_at" END,
      "resolved_at" = NULL
  `;
}

/**
 * Erreur serveur : log Vercel + table `error_events`. Ne lève jamais, pour
 * pouvoir s'appeler depuis n'importe quel catch sans changer son issue.
 */
export async function reportError(context: string, error: unknown): Promise<void> {
  console.error(`[${context}]`, error);
  try {
    const { message, stack } = toErrorParts(error);
    await recordErrorEvent({ source: "SERVER", context, message, stack, appVersion: null });
  } catch (recordError) {
    console.error("[reportError] enregistrement impossible", recordError);
  }
}
