import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedWishlist } from "@/lib/shorten-wishlist";
import { getCurrentUser } from "@/lib/get-current-user";
import { getTranslations } from "next-intl/server";
import { SHARE_ID_LENGTH, getPublicShare, getShareMeta } from "@/lib/wishlist-shares";
import SharedWishlistClient from "./shared-wishlist-client";
import LiveSharedWishlist from "./live-shared-wishlist";

// Réservations et wishlist lues en direct à chaque visite.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

/**
 * Aperçu du lien (iMessage, WhatsApp) : « La liste de Noël de @nathan », pas
 * le titre générique du site. Liste personnelle : jamais indexée.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const robots = { index: false, follow: false };
  const meta = id.length === SHARE_ID_LENGTH ? await getShareMeta(id) : null;
  if (!meta) return { robots };

  const t = await getTranslations({ locale, namespace: "Wishlist.liveShare.og" });
  const name = meta.ownerName ?? t("someone");
  const theme = (["christmas", "birthday", "valentine"] as const).find((th) => th === meta.theme) ?? "default";
  const title = t(`title.${theme}`, { name });
  const description = t("description", { count: meta.count, name });
  return {
    title,
    description,
    robots,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
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
