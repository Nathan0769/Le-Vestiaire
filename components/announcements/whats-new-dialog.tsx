"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, Bell, Gift, Link2, Shirt, Star, Tag, Users, X, type LucideIcon } from "lucide-react";
import { useCurrentAnnouncement } from "@/hooks/useCurrentAnnouncement";
import type { AnnouncementIcon, AnnouncementTarget } from "@/lib/announcements/pick";

const TARGET_HREF: Record<AnnouncementTarget, string> = {
  wishlist: "/wishlist",
  collection: "/collection",
  feed: "/feed",
  profile: "/settings",
};

const ICONS: Record<AnnouncementIcon, LucideIcon> = {
  gift: Gift,
  link: Link2,
  bell: Bell,
  tag: Tag,
  star: Star,
  chart: BarChart3,
  users: Users,
  shirt: Shirt,
};

/**
 * Annonce de nouveautés à l'ouverture, pour un compte connecté (une fois par
 * compte, web et iOS confondus). Format des apps Apple : titre, phrase, lignes
 * icône + titre + phrase, un bouton. Spec : docs/specs/2026-11-11-annonces-nouveautes.md.
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
      <DialogContent
        showCloseButton={false}
        // Pas de focus auto sur la croix (anneau visible à l'ouverture) ; Tab reste piégé dans la fenêtre.
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        {card.imageUrl && (
          // Visuel composé sur fond uni (scripts/announcements) : affiché entier, jamais recadré.
          <div className="relative aspect-[16/10] bg-[#0f3b2c]">
            <Image
              key={card.imageUrl}
              src={card.imageUrl}
              alt=""
              fill
              sizes="(min-width: 640px) 448px, 100vw"
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground cursor-pointer hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <div className="flex flex-col gap-7 px-6 pt-8 pb-6 sm:px-8">
          <div className="space-y-2 pr-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t("kicker")}
            </p>
            <DialogTitle className="text-2xl sm:text-3xl font-bold leading-tight text-balance">{card.title}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">{card.text}</DialogDescription>
          </div>
          {card.items.length > 0 && (
            <ul className="space-y-5">
              {card.items.map((item) => {
                const Icon = ICONS[item.icon] ?? Star;
                return (
                  <li key={item.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold leading-snug">{item.title}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-col gap-2">
            {data.cards.length > 1 && (
              <div className="flex justify-center gap-1.5 pb-2" aria-hidden>
                {data.cards.map((c, i) => (
                  <span
                    key={c.title}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-foreground" : "w-1.5 bg-border"}`}
                  />
                ))}
              </div>
            )}
            <Button size="lg" onClick={next} className="w-full cursor-pointer">
              {isLast ? data.cta.label : t("next")}
            </Button>
            <Button variant="ghost" onClick={close} className="w-full cursor-pointer text-muted-foreground">
              {t("later")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
