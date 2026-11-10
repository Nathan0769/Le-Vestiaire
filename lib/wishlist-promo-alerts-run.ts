import prisma from "@/lib/prisma";
import { getPartnerOffers } from "@/lib/partner-shops/offers";
import { wishlistOffers } from "@/lib/wishlist-offers";
import { selectPromoAlerts, silenceSmallerHalfAtLaunch, type PromoAlertRow } from "@/lib/wishlist-promo-alerts";
import { createNotification } from "@/lib/notifications/create";
import { pushForNotification } from "@/lib/push/notify";
import { buildWishlistPromoMessage } from "@/lib/push/messages";
import { getRatesToEur } from "@/lib/fx";
import { formatMoney } from "@/lib/format-money";
import { DEFAULT_CURRENCY, fromEur, isSupportedCurrency } from "@/lib/currency";
import { reportError } from "@/lib/report-error";

/**
 * Cron quotidien : un résumé « promo sur ta wishlist » par compte, au plus tous
 * les 3 jours (règles anti-spam dans `selectPromoAlerts`).
 * Les prix CFS (`cfsAvailability`, prix site converti) et des boutiques
 * partenaires sont en EUR ; l'économie annoncée est convertie dans la devise
 * du compte.
 */
// Démarrage des alertes (choix de Nathan) : avant cette date le cron ne fait rien,
// le code peut donc être déployé avant.
export const PROMO_ALERTS_START = new Date("2026-11-16T00:00:00Z");

export async function runWishlistPromoAlerts(
  options: { now?: Date; startAt?: Date } = {}
): Promise<{ notified: number; reset: number; silencedAtLaunch: number; skipped?: "before-start" }> {
  const now = options.now ?? new Date();
  if (now < (options.startAt ?? PROMO_ALERTS_START)) {
    return { notified: 0, reset: 0, silencedAtLaunch: 0, skipped: "before-start" };
  }

  const items = await prisma.wishlist.findMany({
    select: {
      id: true,
      userId: true,
      jerseyId: true,
      size: true,
      promoNotifiedPrice: true,
      jersey: { select: { cfsAvailability: { select: { price: true, promoPrice: true, affiliateUrl: true } } } },
    },
  });

  const partnerOffers = await getPartnerOffers([...new Set(items.map((i) => i.jerseyId))]);

  const rows: PromoAlertRow[] = [];
  for (const item of items) {
    const av = item.jersey.cfsAvailability;
    const offers = wishlistOffers({
      cfs: av
        ? { price: Number(av.price), promoPrice: av.promoPrice === null ? null : Number(av.promoPrice), affiliateUrl: av.affiliateUrl }
        : null,
      partnerOffers: partnerOffers.get(item.jerseyId) ?? [],
      size: item.size,
    });
    const notifiedPrice = item.promoNotifiedPrice === null ? null : Number(item.promoNotifiedPrice);
    // Meilleure offre en promo : c'est elle qu'on annonce, même si une offre sans promo est moins chère.
    const promo = offers.find((o) => o.compareAtPrice !== null);
    if (!promo && notifiedPrice === null) continue;
    rows.push({
      wishlistId: item.id,
      userId: item.userId,
      bestPrice: promo?.price ?? 0,
      comparePrice: promo?.compareAtPrice ?? null,
      notifiedPrice,
    });
  }

  // Premier passage (aucune alerte ni promo annoncée en base) : la moitié la plus
  // petite des promos de chaque compte est marquée annoncée, sans push.
  let silencedAtLaunch = 0;
  const alreadyLaunched =
    (await prisma.notification.count({ where: { type: "WISHLIST_PROMO" } })) > 0 ||
    (await prisma.wishlist.count({ where: { promoNotifiedPrice: { not: null } } })) > 0;
  if (!alreadyLaunched) {
    const silenced = silenceSmallerHalfAtLaunch(rows);
    await prisma.$transaction(
      silenced.map((s) => prisma.wishlist.update({ where: { id: s.wishlistId }, data: { promoNotifiedPrice: s.price } }))
    );
    const price = new Map(silenced.map((s) => [s.wishlistId, s.price]));
    for (const r of rows) {
      if (price.has(r.wishlistId)) r.notifiedPrice = price.get(r.wishlistId)!;
    }
    silencedAtLaunch = silenced.length;
  }

  // Dernière alerte de chaque compte concerné : délai de 3 jours entre deux pushs.
  const lastAlerts = await prisma.notification.groupBy({
    by: ["userId"],
    where: { type: "WISHLIST_PROMO", userId: { in: [...new Set(rows.map((r) => r.userId))] } },
    _max: { createdAt: true },
  });
  const lastAlertAt = new Map(
    lastAlerts.flatMap((a) => (a._max.createdAt ? [[a.userId, a._max.createdAt] as const] : []))
  );

  const { byUser, toReset } = selectPromoAlerts(rows, { lastAlertAt, now });

  if (toReset.length > 0) {
    await prisma.wishlist.updateMany({ where: { id: { in: toReset } }, data: { promoNotifiedPrice: null } });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: [...byUser.keys()] } },
    select: { id: true, currency: true },
  });
  const currencyOf = new Map(users.map((u) => [u.id, u.currency]));
  const rates = await getRatesToEur();

  let notified = 0;
  for (const [userId, alert] of byUser) {
    try {
      // Prix enregistrés d'abord : un échec d'envoi ne doit pas renvoyer l'alerte demain.
      await prisma.$transaction(
        alert.wishlistIds.map((id) =>
          prisma.wishlist.update({ where: { id }, data: { promoNotifiedPrice: alert.prices[id] } })
        )
      );

      const stored = currencyOf.get(userId);
      const currency = stored && isSupportedCurrency(stored) ? stored : DEFAULT_CURRENCY;
      const saving = fromEur(alert.maxSaving, currency, rates) ?? alert.maxSaving;

      const notification = await createNotification({ userId, type: "WISHLIST_PROMO" });
      if (!notification) continue;

      await pushForNotification({
        recipientId: userId,
        type: "WISHLIST_PROMO",
        message: (locale) =>
          buildWishlistPromoMessage(alert.count, formatMoney(saving, currency, locale ?? "fr"), locale),
      });
      notified += 1;
    } catch (err) {
      await reportError("cron.wishlist-promos", err);
    }
  }

  return { notified, reset: toReset.length, silencedAtLaunch };
}
