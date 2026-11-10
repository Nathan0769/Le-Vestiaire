import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedWishlist } from "@/lib/shorten-wishlist";
import { getCurrentUser } from "@/lib/get-current-user";
import { SHARE_ID_LENGTH, getPublicShare } from "@/lib/wishlist-shares";
import SharedWishlistClient from "./shared-wishlist-client";
import LiveSharedWishlist from "./live-shared-wishlist";

// Réservations et wishlist lues en direct à chaque visite.
export const dynamic = "force-dynamic";

// Liste personnelle : jamais indexée.
export const metadata: Metadata = { robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedWishlistPage({ params }: PageProps) {
  const { id } = await params;

  // Partage vivant (12 caractères) ; les anciens liens Redis (8) restent servis plus bas.
  if (id.length === SHARE_ID_LENGTH) {
    const viewer = await getCurrentUser();
    const share = await getPublicShare(id, viewer?.id ?? null);
    if (!share) notFound();
    return <LiveSharedWishlist share={share} />;
  }

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
