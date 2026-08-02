"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { MembershipCard } from "@/components/supporter/membership-card";
import { Loader2, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ShareableCardProps {
  name: string;
  userId: string;
  jerseyCount?: number;
  since: number;
}

/**
 * Carte de membre + partage : capture le rendu réel de la carte en PNG
 * (pixelRatio 2 pour une image nette en story), puis propose le partage natif
 * si disponible (mobile) sinon un téléchargement.
 */
export function ShareableCard({
  name,
  userId,
  jerseyCount,
  since,
}: ShareableCardProps) {
  const t = useTranslations("Pricing.member");
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      // cacheBust évite les images cross-origin en cache sans header CORS.
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "ma-carte-le-vestiaire.png", {
        type: "image/png",
      });

      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: t("shareTitle"),
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "ma-carte-le-vestiaire.png";
        a.click();
      }
    } catch {
      // Partage annulé ou capture impossible : pas d'erreur bloquante à afficher.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div ref={cardRef} className="w-full max-w-[420px]">
        <MembershipCard
          name={name}
          userId={userId}
          jerseyCount={jerseyCount}
          since={since}
        />
      </div>

      <Button
        onClick={handleShare}
        disabled={loading}
        variant="outline"
        className="cursor-pointer"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="mr-2 h-4 w-4" />
        )}
        {t("share")}
      </Button>
    </div>
  );
}
