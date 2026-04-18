"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AutocompleteSelect, type SelectOption } from "@/components/ui/comboBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";
import { useDebounce } from "@/hooks/useDebounce";
import { Check, X, Loader2 } from "lucide-react";

interface OnboardingProps {
  initialUsername: string;
}

export function OnboardingFavoriteClub({ initialUsername }: OnboardingProps) {
  const t = useTranslations("Onboarding");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Étape 1 — pseudo
  const [username, setUsername] = useState(initialUsername);
  const [availability, setAvailability] = useState<{
    available: boolean;
    error?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const debouncedUsername = useDebounce(username, 500);

  // Étape 2 — club
  const [clubs, setClubs] = useState<SelectOption[]>([]);
  const [selectedClub, setSelectedClub] = useState<SelectOption | null>(null);
  const [clubsLoaded, setClubsLoaded] = useState(false);

  // Vérification disponibilité pseudo (debounced + annulation si démontage)
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 5) {
      setAvailability(null);
      return;
    }
    if (debouncedUsername.toLowerCase() === initialUsername.toLowerCase()) {
      setAvailability({ available: true });
      return;
    }

    const controller = new AbortController();
    setIsChecking(true);

    fetch(
      `/api/user/username/check?username=${encodeURIComponent(debouncedUsername)}`,
      { signal: controller.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setAvailability(data); })
      .catch((err) => { if (err.name !== "AbortError") setAvailability(null); })
      .finally(() => setIsChecking(false));

    return () => controller.abort();
  }, [debouncedUsername, initialUsername]);

  const isUsernameValid =
    username.toLowerCase() === initialUsername.toLowerCase() ||
    availability?.available === true;

  const loadClubs = useCallback(async () => {
    if (clubsLoaded) return;
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) return;
      setClubs(await res.json());
      setClubsLoaded(true);
    } catch (err) {
      console.error("Erreur chargement clubs :", err);
    }
  }, [clubsLoaded]);

  const handleStep1Continue = async () => {
    // Pseudo inchangé → on passe directement sans appel API
    if (username.toLowerCase() !== initialUsername.toLowerCase()) {
      setLoading(true);
      try {
        const res = await fetch("/api/user/username", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setAvailability({ available: false, error: data.error });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Erreur mise à jour pseudo :", err);
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setStep(2);
  };

  const handleStep2Continue = async () => {
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
      if (!res.ok) throw new Error("Erreur");
    } catch (err) {
      console.error("Erreur sauvegarde club favori :", err);
      setLoading(false);
    }
    router.push("/");
  };

  const statusIcon = isChecking ? (
    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
  ) : !availability || username.length < 5 ? null : availability.available ? (
    <Check className="w-4 h-4 text-green-600" />
  ) : (
    <X className="w-4 h-4 text-red-600" />
  );

  const helperText =
    username.length < 5
      ? t("usernameRules")
      : username.toLowerCase() === initialUsername.toLowerCase()
        ? null
        : availability && !availability.available
          ? availability.error || t("usernameUnavailable")
          : availability?.available
            ? t("usernameAvailable")
            : null;

  const helperColor =
    !availability || username.length < 5
      ? "text-muted-foreground"
      : availability.available
        ? "text-green-600"
        : "text-red-600";

  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Logo centered />

        {/* Barre de progression */}
        <div className="flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-primary" />
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              step === 2 ? "bg-primary" : "bg-muted-foreground/20"
            }`}
          />
        </div>

        {step === 1 && (
          <>
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-semibold">{t("step1Title")}</h1>
              <p className="text-sm text-muted-foreground">{t("step1Subtitle")}</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("usernamePlaceholder")}
                  maxLength={20}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {statusIcon}
                </div>
              </div>
              {helperText && (
                <p className={`text-sm ${helperColor}`}>{helperText}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStep1Continue}
                disabled={loading || (username.length >= 5 && !isUsernameValid)}
                className="w-full cursor-pointer"
              >
                {loading ? "..." : t("cta")}
              </Button>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center cursor-pointer"
              >
                {t("skip")}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-semibold">{t("step2Title")}</h1>
              <p className="text-sm text-muted-foreground">{t("step2Subtitle")}</p>
            </div>

            <div onFocus={loadClubs} onMouseEnter={loadClubs}>
              <AutocompleteSelect
                options={clubs}
                value={selectedClub}
                onChange={setSelectedClub}
                placeholder={t("placeholder")}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStep2Continue}
                disabled={loading}
                className="w-full cursor-pointer"
              >
                {loading ? "..." : t("cta")}
              </Button>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center cursor-pointer"
              >
                {t("skip")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
