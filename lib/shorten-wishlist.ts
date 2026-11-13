import { kv } from "@vercel/kv";
import type { ShareData } from "@/types/wishlist-share";

/**
 * Anciens liens de partage (8 caractères, Redis, 90 jours), encore servis jusqu'à
 * expiration. Les nouveaux liens passent par `WishlistShare` (lib/wishlist-shares.ts).
 */
export async function getSharedWishlist(
  shortId: string
): Promise<ShareData | null> {
  const data = await kv.get<ShareData>(`wishlist:${shortId}`);
  return data;
}
