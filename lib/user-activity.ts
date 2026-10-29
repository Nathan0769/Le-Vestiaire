// La clé vit 2 jours pour couvrir le décalage entre jour UTC et fuseaux des utilisateurs
const KEY_TTL_SECONDS = 172800;

export type ActivityPlatform = "ios" | "web";

export type UserActivityDeps = {
  /** Pose la clé si elle n'existe pas. `true` = clé nouvelle. */
  setOnce: (key: string, ttlSeconds: number) => Promise<boolean>;
  insertDay: (userId: string, day: string, platform: ActivityPlatform) => Promise<void>;
};

// Imports dynamiques : les tests unit injectent leurs deps sans charger Redis ni Prisma
const defaultDeps: UserActivityDeps = {
  async setOnce(key, ttlSeconds) {
    const { redis } = await import("@/lib/redis");
    const result = await redis.set(key, 1, { nx: true, ex: ttlSeconds });
    return result === "OK";
  },
  async insertDay(userId, day, platform) {
    const { default: prisma } = await import("@/lib/prisma");
    await prisma.$executeRaw`
      INSERT INTO user_activity_days (user_id, day, platform)
      VALUES (${userId}, ${day}::date, ${platform})
      ON CONFLICT DO NOTHING
    `;
  },
};

/**
 * Note qu'un utilisateur a été actif aujourd'hui (jour UTC), pour les actifs
 * et cohortes du dashboard KPI. Redis filtre les doublons pour qu'il y ait au
 * plus une écriture en base par utilisateur, jour et plateforme.
 *
 * Ne lève jamais : le suivi d'activité ne doit pas faire échouer une requête.
 */
export async function recordUserActivity(
  userId: string,
  platform: ActivityPlatform,
  now: Date = new Date(),
  deps: UserActivityDeps = defaultDeps
): Promise<void> {
  try {
    const day = now.toISOString().slice(0, 10);
    const isFirstVisitOfDay = await deps.setOnce(
      `user-activity:${userId}:${day}:${platform}`,
      KEY_TTL_SECONDS
    );
    if (isFirstVisitOfDay) {
      await deps.insertDay(userId, day, platform);
    }
  } catch {
    // Volontairement ignoré : une donnée d'activité manquante vaut mieux qu'une requête en erreur
  }
}
