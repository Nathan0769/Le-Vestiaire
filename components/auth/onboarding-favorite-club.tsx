"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AutocompleteSelect, type SelectOption } from "@/components/ui/comboBox";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";

export function OnboardingFavoriteClub() {
  const t = useTranslations("Onboarding");
  const router = useRouter();

  const [clubs, setClubs] = useState<SelectOption[]>([]);
  const [selectedClub, setSelectedClub] = useState<SelectOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [clubsLoaded, setClubsLoaded] = useState(false);

  const loadClubs = useCallback(async () => {
    if (clubsLoaded) return;
    try {
      const res = await fetch("/api/clubs", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setClubs(data);
      setClubsLoaded(true);
    } catch (err) {
      console.error("Erreur chargement clubs :", err);
    }
  }, [clubsLoaded]);

  const handleContinue = async () => {
    if (!selectedClub) {
      router.push("/");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/favorite-club", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteClubId: selectedClub.id }),
      });

      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
    } catch (err) {
      console.error("Erreur sauvegarde club favori :", err);
      setLoading(false);
    }
    router.push("/");
  };

  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Logo centered />

        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div
          className="flex flex-col gap-4"
          onFocus={loadClubs}
          onMouseEnter={loadClubs}
        >
          <AutocompleteSelect
            options={clubs}
            value={selectedClub}
            onChange={setSelectedClub}
            placeholder={t("placeholder")}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleContinue} disabled={loading} className="w-full cursor-pointer">
            {loading ? "..." : t("cta")}
          </Button>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center cursor-pointer"
          >
            {t("skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
