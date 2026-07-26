"use client";

import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/routing";
import { trackEvent } from "@/lib/analytics";
import type { JerseyAddPayload } from "@/types/feed";

interface PostShareButtonProps {
  payload: JerseyAddPayload;
  postType: string;
}

export function PostShareButton({ payload, postType }: PostShareButtonProps) {
  const t = useTranslations("Feed.post");
  const tType = useTranslations("JerseyType");
  const locale = useLocale();

  const handleShare = async () => {
    const { club, id, type, season } = payload.jersey;

    // Fiche catalogue publique (browse-first) plutôt que le deep-link feed
    // auth-gated : un ami sans compte peut voir le maillot partagé.
    const path = getPathname({
      href: `/jerseys/${club.leagueId}/clubs/${club.id}/jerseys/${id}`,
      locale,
    });
    const url = `${window.location.origin}${path}`;

    const title = t("jerseyTitleTemplate", {
      type: tType(type as never),
      club: club.shortName,
      season,
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        trackEvent({
          name: "post_shared",
          params: { post_type: postType, method: "native" },
        });
      } catch {
        // Partage annulé par l'utilisateur : rien à signaler.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("shareCopied"));
      trackEvent({
        name: "post_shared",
        params: { post_type: postType, method: "clipboard" },
      });
    } catch {
      toast.error(t("shareError"));
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className="cursor-pointer"
      aria-label={t("share")}
    >
      <Send className="w-5 h-5" />
    </Button>
  );
}
