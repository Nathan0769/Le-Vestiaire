import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { getR2PublicUrl, STATIC_BUCKET } from "@/lib/r2-storage";
import { ANNOUNCEMENTS } from "@/lib/announcements/catalog";
import {
  idsToMarkSeen,
  pickAnnouncement,
  type AnnouncementPlatform,
  type AnnouncementTarget,
} from "@/lib/announcements/pick";
import type { Locale } from "@/i18n/locales";

/** Forme envoyée au web et à l'iOS (contrat `announcement-current`). */
export interface CurrentAnnouncement {
  id: string;
  cards: { title: string; text: string; imageUrl: string }[];
  cta: { label: string; target: AnnouncementTarget };
}

export async function getCurrentAnnouncement(
  user: { id: string; createdAt: Date; role?: string | null },
  platform: AnnouncementPlatform,
  locale: Locale
): Promise<CurrentAnnouncement | null> {
  const seen = await prisma.announcementView.findMany({
    where: { userId: user.id },
    select: { announcementId: true },
  });
  const announcement = pickAnnouncement({
    catalog: ANNOUNCEMENTS,
    now: new Date(),
    user: { createdAt: new Date(user.createdAt), isAdmin: user.role === "admin" || user.role === "superadmin" },
    seenIds: new Set(seen.map((s) => s.announcementId)),
    platform,
  });
  if (!announcement) return null;

  const t = await getTranslations({ locale, namespace: `Announcements.${announcement.id}` });
  return {
    id: announcement.id,
    cards: announcement.cards.map((card) => ({
      title: t(`cards.${card.key}.title`),
      text: t(`cards.${card.key}.text`),
      imageUrl: getR2PublicUrl(STATIC_BUCKET, card.image),
    })),
    cta: { label: t("cta"), target: announcement.ctaTarget },
  };
}

/** Marque l'annonce et les plus anciennes comme vues. Faux si l'id est inconnu. */
export async function markAnnouncementSeen(userId: string, announcementId: string): Promise<boolean> {
  const ids = idsToMarkSeen(ANNOUNCEMENTS, announcementId);
  if (ids.length === 0) return false;
  await prisma.announcementView.createMany({
    data: ids.map((id) => ({ userId, announcementId: id })),
    skipDuplicates: true,
  });
  return true;
}
