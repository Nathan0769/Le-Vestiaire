"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { CurrentAnnouncement } from "@/lib/announcements/current";
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
  const { data: session } = authClient.useSession();
  const [index, setIndex] = useState(0);
  const [closedId, setClosedId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["announcement-current"],
    queryFn: async () => {
      const res = await fetch("/api/announcements/current");
      if (!res.ok) return null;
      const body = (await res.json()) as { announcement: CurrentAnnouncement | null };
      return body.announcement;
    },
    enabled: !!session?.user,
    // Une fois par visite : pas de nouvel essai au retour sur l'onglet.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

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
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden gap-0 sm:grid-cols-2">
        <div className="relative bg-muted aspect-[4/5] sm:aspect-auto sm:min-h-[460px] max-h-[45vh] sm:max-h-none">
          <Image
            key={card.imageUrl}
            src={card.imageUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 384px, 100vw"
            className="object-cover object-top"
            unoptimized
          />
        </div>
        <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t("kicker")}
            </p>
            <DialogTitle className="text-2xl font-bold leading-tight text-balance">{card.title}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">{card.text}</DialogDescription>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1.5" aria-hidden>
              {data.cards.map((c, i) => (
                <span
                  key={c.imageUrl}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-foreground" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
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
