import prisma from "@/lib/prisma";

/** Durée de conservation annoncée dans la politique de confidentialité. */
export const SIGNUP_ATTRIBUTION_RETENTION_MONTHS = 25;

/**
 * Supprime les sources d'inscription de plus de 25 mois. Le compte n'est pas
 * touché. Appelée chaque mois par le cron `purge-data`.
 */
export async function purgeExpiredSignupAttributions(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - SIGNUP_ATTRIBUTION_RETENTION_MONTHS);
  const { count } = await prisma.signupAttribution.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return count;
}
