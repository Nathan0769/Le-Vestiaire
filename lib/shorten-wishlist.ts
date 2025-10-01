import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";
import type { ShareData } from "@/types/wishlist-share";

export async function createShortWishlistUrl(data: ShareData): Promise<string> {
  const shortId = nanoid(8);

  await kv.set(`wishlist:${shortId}`, data, {
    ex: 60 * 60 * 24 * 90,
  });

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  return `${baseUrl}/w/${shortId}`;
}

export async function getSharedWishlist(
  shortId: string
): Promise<ShareData | null> {
  const data = await kv.get<ShareData>(`wishlist:${shortId}`);
  return data;
}
