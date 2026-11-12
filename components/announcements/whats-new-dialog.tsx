"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useCurrentAnnouncement } from "@/hooks/useCurrentAnnouncement";
import type { AnnouncementTarget } from "@/lib/announcements/pick";

const TARGET_HREF: Record<AnnouncementTarget, string> = {
  wishlist: "/wishlist",
  collection: "/collection",
  feed: "/feed",
  profile: "/settings",
};

/**
 * Annonce de nouveautés à l'ouverture, pour un compte connecté (une fois par
 * compte, web et iOS confondus). Spec : docs/specs/2026-11-11-annonces-nouveautes.md.
 */
export function WhatsNewDialog() {
  const t = useTranslations("Announcements");
  const router = useRouter();
  const { announcement: data } = useCurrentAnnouncement();
  const [index, setIndex] = useState(0);
  const [closedId, setClosedId] = useState<string | null>(null);

  if (!data || closedId === data.id) return null;
  const card = data.cards[index];
  const isLast = index === data.cards.length - 1;

  const close = () => {
    setClosedId(data.id);
    // Fermée = vue : même en cas d'échec réseau, elle ne revient pas dans cette visite.
    void fetch(`/api/announcements/${encodeURIComponent(data.id)}/seen`, { method: "POST" });
  };

  const next = () => {
    if (!isLast) return setIndex(index + 1);
    close();
    router.push(TARGET_HREF[data.cta.target]);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg p-0 overflow-hidden gap-0 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        {/* Visuels composés au format 16:10 (scripts/announcements) : affichés entiers, jamais recadrés. */}
        <div className="relative aspect-[16/10] bg-[#0f3b2c]">
          <Image
            key={card.imageUrl}
            src={card.imageUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 512px, 100vw"
            className="object-contain"
            unoptimized
          />
          {/* Croix sur fond plein : la croix par défaut disparaît sur le vert. */}
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-6 p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t("kicker")}
            </p>
            <DialogTitle className="text-2xl font-bold leading-tight text-balance">{card.title}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">{card.text}</DialogDescription>
          </div>
          {card.points.length > 0 && (
            <ul className="space-y-3">
              {card.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {data.cards.length > 1 ? (
              <div className="flex gap-1.5" aria-hidden>
                {data.cards.map((c, i) => (
                  <span
                    key={c.imageUrl}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-foreground" : "w-1.5 bg-border"}`}
                  />
                ))}
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" onClick={close} className="cursor-pointer">
                {t("later")}
              </Button>
              <Button onClick={next} className="cursor-pointer">
                {isLast ? data.cta.label : t("next")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
