import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/w\/([^/]+)/);
  const id = match?.[1];
  return NextResponse.redirect(new URL(`/wishlist/share/${id}`, url.origin));
}
