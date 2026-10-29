import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import {
  buildErrorEvent,
  isPaymentErrorContext,
  toErrorParts,
  type ErrorEventInput,
} from "@/lib/error-events";
import { sendPaymentErrorAlert } from "@/lib/error-digest";

/**
 * Enregistre une occurrence. Upsert atomique sur le fingerprint : deux
 * occurrences simultanées ne créent pas deux lignes. Une erreur marquée
 * résolue qui revient est rouverte et repart dans le prochain digest.
 * Retourne le fingerprint de la ligne.
 */
export async function recordErrorEvent(input: ErrorEventInput): Promise<string> {
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
  return e.fingerprint;
}

/**
 * Erreur serveur : log Vercel + table `error_events`, et email immédiat si elle
 * touche le paiement. Ne lève jamais, pour pouvoir s'appeler depuis n'importe
 * quel catch sans changer son issue.
 *
 * L'alerte immédiate ne vaut que pour le serveur : la route publique des
 * erreurs iOS permettrait sinon à n'importe qui d'envoyer des emails à l'admin.
 */
export async function reportError(context: string, error: unknown): Promise<void> {
  console.error(`[${context}]`, error);
  let fingerprint: string;
  try {
    const { message, stack } = toErrorParts(error);
    fingerprint = await recordErrorEvent({ source: "SERVER", context, message, stack, appVersion: null });
  } catch (recordError) {
    console.error("[reportError] enregistrement impossible", recordError);
    return;
  }

  if (!isPaymentErrorContext(context)) return;
  try {
    await sendPaymentErrorAlert(fingerprint);
  } catch (alertError) {
    console.error("[reportError] alerte paiement impossible", alertError);
  }
}
