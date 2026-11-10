/**
 * Choix des alertes promo wishlist (cron quotidien). Fonction pure : le cron
 * (`lib/wishlist-promo-alerts-run.ts`) charge les lignes et applique le résultat.
 *
 * Une promo n'est notifiée qu'une fois : `notifiedPrice` garde le meilleur prix
 * déjà annoncé, on ne renotifie que s'il baisse encore. Promo finie = remise à
 * null, pour qu'une nouvelle promo puisse repartir.
 *
 * Anti-spam (choix de Nathan, 2026-11-09) : une promo ne compte qu'à partir de
 * -20 % et -15 €, une nouvelle baisse doit faire 10 € de plus, et un compte reçoit
 * au plus une alerte tous les 3 jours. Pendant l'attente rien n'est consommé :
 * les promos s'accumulent et partent groupées dans l'alerte suivante.
 */

export const PROMO_MIN_SAVING_EUR = 15;
export const PROMO_MIN_DISCOUNT = 0.2;
export const PROMO_MIN_EXTRA_DROP_EUR = 10;
// Une heure de marge : le cron passe chaque jour à la même heure, à quelques minutes près.
export const PROMO_COOLDOWN_MS = 3 * 24 * 3600 * 1000 - 3600 * 1000;

export interface PromoAlertRow {
  wishlistId: string;
  userId: string;
  /** Prix de la meilleure offre, en EUR. */
  bestPrice: number;
  /** Prix barré de la meilleure offre en promo (EUR), null hors promo. */
  comparePrice: number | null;
  /** Meilleur prix déjà notifié (EUR), null si rien de notifié. */
  notifiedPrice: number | null;
}

export interface UserPromoAlert {
  count: number;
  maxSaving: number;
  wishlistIds: string[];
  /** Prix à enregistrer comme notifié, par envie. */
  prices: Record<string, number>;
}

const savingOf = (r: PromoAlertRow) =>
  r.comparePrice !== null ? Math.round((r.comparePrice - r.bestPrice) * 100) / 100 : 0;

/** Promo assez forte pour une alerte : -20 % et -15 € à la fois. */
const isWorthAlert = (r: PromoAlertRow) =>
  r.comparePrice !== null && savingOf(r) >= PROMO_MIN_SAVING_EUR && savingOf(r) / r.comparePrice >= PROMO_MIN_DISCOUNT;

export function selectPromoAlerts(
  rows: PromoAlertRow[],
  options: { lastAlertAt?: Map<string, Date>; now?: Date } = {}
): {
  byUser: Map<string, UserPromoAlert>;
  toReset: string[];
} {
  const now = options.now ?? new Date();
  const byUser = new Map<string, UserPromoAlert>();
  const toReset: string[] = [];

  const inCooldown = (userId: string) => {
    const last = options.lastAlertAt?.get(userId);
    return last !== undefined && now.getTime() - last.getTime() < PROMO_COOLDOWN_MS;
  };

  for (const r of rows) {
    const saving = savingOf(r);
    if (!isWorthAlert(r)) {
      if (r.notifiedPrice !== null) toReset.push(r.wishlistId);
      continue;
    }
    if (r.notifiedPrice !== null && r.bestPrice > r.notifiedPrice - PROMO_MIN_EXTRA_DROP_EUR) continue;
    if (inCooldown(r.userId)) continue;

    const alert = byUser.get(r.userId) ?? { count: 0, maxSaving: 0, wishlistIds: [], prices: {} };
    alert.count += 1;
    alert.maxSaving = Math.max(alert.maxSaving, saving);
    alert.wishlistIds.push(r.wishlistId);
    alert.prices[r.wishlistId] = r.bestPrice;
    byUser.set(r.userId, alert);
  }

  return { byUser, toReset };
}

/**
 * Lancement des alertes (choix de Nathan, 2026-11-09) : au tout premier passage,
 * pour chaque compte, la moitié la plus petite des promos déjà en cours est
 * marquée comme annoncée (silencieuse) ; la plus grosse moitié, arrondie au-dessus,
 * part dans la première alerte. Évite un premier push qui liste tout l'existant.
 */
export function silenceSmallerHalfAtLaunch(rows: PromoAlertRow[]): { wishlistId: string; price: number }[] {
  const byUser = new Map<string, PromoAlertRow[]>();
  for (const r of rows) {
    if (r.notifiedPrice !== null || !isWorthAlert(r)) continue;
    byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
  }
  const silenced: { wishlistId: string; price: number }[] = [];
  for (const promos of byUser.values()) {
    const sorted = [...promos].sort((a, b) => savingOf(b) - savingOf(a));
    for (const r of sorted.slice(Math.ceil(sorted.length / 2))) {
      silenced.push({ wishlistId: r.wishlistId, price: r.bestPrice });
    }
  }
  return silenced;
}
