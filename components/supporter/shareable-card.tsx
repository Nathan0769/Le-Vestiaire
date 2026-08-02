"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MembershipCard } from "@/components/supporter/membership-card";
import { Loader2, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ShareableCardProps {
  name: string;
  userId: string;
  jerseyCount?: number;
  since: number;
  /** Action secondaire affichée à côté du bouton de partage (ex. gérer l'abo). */
  children?: React.ReactNode;
}

/**
 * Carte de membre + partage : capture le rendu réel de la carte en PNG
 * (pixelRatio 2 pour une image nette en story). Partage natif si disponible
 * (mobile), sinon téléchargement. La trame guilloché est neutralisée le temps
 * de la capture car html-to-image rend mal les masques CSS.
 */
export function ShareableCard({
  name,
  userId,
  jerseyCount,
  since,
  children,
}: ShareableCardProps) {
  const t = useTranslations("Pricing.member");
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    const el = cardRef.current;
    if (!el) return;

    setLoading(true);
    el.classList.add("cos-capturing");
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "ma-carte-le-vestiaire.png", {
        type: "image/png",
      });

      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: t("shareTitle") });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "ma-carte-le-vestiaire.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(t("shareDownloaded"));
      }
    } catch (error) {
      // Partage natif annulé par l'utilisateur : pas une erreur à signaler.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("shareError"));
    } finally {
      el.classList.remove("cos-capturing");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div ref={cardRef}>
        <MembershipCard
          name={name}
          userId={userId}
          jerseyCount={jerseyCount}
          since={since}
          className="max-w-none"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={handleShare}
          disabled={loading}
          className="flex-1 cursor-pointer bg-[#e6c766] text-[#2a2008] hover:bg-[#eccd6a]"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          {t("share")}
        </Button>
        {children}
      </div>
    </div>
  );
}
