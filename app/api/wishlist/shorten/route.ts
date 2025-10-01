import { NextResponse } from "next/server";
import { createShortWishlistUrl } from "@/lib/shorten-wishlist";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const shortUrl = await createShortWishlistUrl(data);

    return NextResponse.json({ shortUrl });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json(
      { error: "Failed to create short URL" },
      { status: 500 }
    );
  }
}
