import { Resend } from "resend";
import { createHmac } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = "Le Vestiaire <noreply@mail.le-vestiaire-foot.fr>";
export const APP_URL = process.env.BETTER_AUTH_URL ?? "https://levestiairefoot.com";

// Génère un token HMAC signé pour le désabonnement
export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.BETTER_AUTH_SECRET ?? "";
  return createHmac("sha256", secret).update(userId).digest("hex");
}

// Vérifie un token de désabonnement
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId);
  // Comparaison en temps constant pour éviter les timing attacks
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export function buildUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${APP_URL}/api/unsubscribe?userId=${userId}&token=${token}`;
}

export { resend };
