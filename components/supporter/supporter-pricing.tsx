"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type Interval = "monthly" | "yearly";

const PRICES: Record<Interval, string> = {
  monthly: "1,99 €",
  yearly: "19,99 €",
};

export function SupporterPricing() {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const [loading, setLoading] = useState<Interval | null>(null);

  const handleCheckout = async (interval: Interval) => {
    setLoading(interval);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {(["monthly", "yearly"] as const).map((interval) => {
          const highlighted = interval === "yearly";
          return (
            <div
              key={interval}
              className={cn(
                "relative flex flex-col rounded-xl bg-card p-6 text-center",
                highlighted
                  ? "border-2 border-[#c9a84c]/60 shadow-[0_10px_40px_-12px_rgba(201,168,76,0.45)]"
                  : "border border-border"
              )}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#c9a84c] px-3 py-0.5 text-[11px] font-semibold text-[#2a2008]">
                  {t("premium.yearly.savings")}
                </span>
              )}

              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {PRICES[interval]}
                </span>
                <span className="text-muted-foreground">
                  /{t(`premium.${interval}.period`)}
                </span>
              </div>
              <p className="mt-2 min-h-[40px] text-sm text-muted-foreground">
                {t(`premium.${interval}.description`)}
              </p>

              <Button
                onClick={() => handleCheckout(interval)}
                disabled={loading !== null}
                size="lg"
                variant={highlighted ? "default" : "outline"}
                className={cn(
                  "mt-5 h-11 w-full cursor-pointer",
                  highlighted
                    ? "border-0 bg-gradient-to-r from-[#e6c34d] to-[#c9a84c] font-semibold text-[#2a2008] shadow-md hover:from-[#f0d066] hover:to-[#d4af37]"
                    : "border-[#c9a84c]/50 hover:bg-[#c9a84c]/10"
                )}
              >
                {loading === interval ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Heart className="mr-2 h-4 w-4" />
                )}
                {t(`premium.${interval}.button`)}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("cancelAnytime")}
      </p>
    </div>
  );
}
