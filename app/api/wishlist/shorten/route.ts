import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { createShortWishlistUrl } from "@/lib/shorten-wishlist";

const WishlistJerseySchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  imageUrl: z.string().max(500),
  type: z.string().max(50),
  variant: z.number().int().min(0),
  season: z.string().max(20),
  club: z.object({ name: z.string().max(200) }),
});

const ShareableItemSchema = z.object({
  id: z.string(),
  jersey: WishlistJerseySchema,
});

const ShareDataSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(500).optional(),
  theme: z.enum(["christmas", "birthday", "default", "valentine"]),
  jerseys: z.array(ShareableItemSchema).min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = ShareDataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const shortUrl = await createShortWishlistUrl(parsed.data);
    return NextResponse.json({ shortUrl });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
