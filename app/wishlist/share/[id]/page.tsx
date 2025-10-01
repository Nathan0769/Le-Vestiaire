import { notFound } from "next/navigation";
import { getSharedWishlist } from "@/lib/shorten-wishlist";
import SharedWishlistClient from "./shared-wishlist-client";

interface PageProps {
  params: { id: string };
}

export default async function SharedWishlistPage({ params }: PageProps) {
  const { id } = params;

  const shareData = await getSharedWishlist(id);

  if (!shareData) {
    notFound();
  }

  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    }/api/jerseys/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: shareData.jerseys.map((j) => j.id) }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    notFound();
  }

  const jerseys = await response.json();

  return (
    <SharedWishlistClient
      title={shareData.title}
      message={shareData.message}
      theme={shareData.theme}
      jerseys={jerseys}
    />
  );
}
