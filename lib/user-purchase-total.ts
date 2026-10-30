import prisma from "@/lib/prisma";
import { DEFAULT_CURRENCY, fromEur } from "@/lib/currency";
import { getRatesToEur } from "@/lib/fx";
import { sumPurchasesEur } from "@/lib/purchase-totals";

/**
 * Total des prix d'achat d'un user, dans sa devise préférée (EUR par défaut).
 * `totalValue` vaut null si aucun prix n'est renseigné.
 */
export async function getUserPurchaseTotal(
  userId: string
): Promise<{ totalValue: number | null; currency: string }> {
  const [items, owner, rates] = await Promise.all([
    prisma.userJersey.findMany({
      where: { userId, purchasePrice: { not: null } },
      select: { purchasePrice: true, purchaseCurrency: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
    getRatesToEur(),
  ]);

  const currency = owner?.currency && rates[owner.currency] ? owner.currency : DEFAULT_CURRENCY;
  if (items.length === 0) return { totalValue: null, currency };

  const totalEur = sumPurchasesEur(items, rates);
  const total = fromEur(totalEur, currency, rates) ?? totalEur;
  return { totalValue: Math.round(total * 100) / 100, currency };
}
