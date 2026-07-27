"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MembershipCard } from "@/components/supporter/membership-card";
import { SupporterBadge } from "@/components/supporter/supporter-badge";
import { CosmeticsSettings } from "@/components/settings/cosmetics-settings";
import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface MemberAreaProps {
  name: string;
  userId: string;
  jerseyCount?: number;
  since: number;
}

/**
 * Espace membre affiché sur /soutien pour un supporter connecté :
 * sa carte en héros, un remerciement, et les accès abonnement / cosmétiques.
 */
export function MemberArea({ name, userId, jerseyCount, since }: MemberAreaProps) {
  const t = useTranslations("Pricing.member");
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <header className="text-center space-y-3">
        <div className="flex justify-center">
          <SupporterBadge size="lg" />
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex justify-center">
        <MembershipCard
          name={name}
          userId={userId}
          jerseyCount={jerseyCount}
          since={since}
        />
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleManage}
          disabled={loading}
          variant="outline"
          className="cursor-pointer"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          {t("manage")}
        </Button>
      </div>

      {/* Cosmétiques du supporter */}
      <CosmeticsSettings />
    </div>
  );
}
