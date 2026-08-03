"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
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
                "relative flex flex-col rounded-2xl p-6 text-center",
                highlighted
                  ? "bg-[#e6c766] text-[#2a2008] shadow-[0_14px_44px_-16px_rgba(201,168,76,0.65)]"
                  : "border border-border bg-card shadow-sm"
              )}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2a2008] px-3 py-1 text-[11px] font-semibold text-[#f4e6b0] shadow">
                  {t("premium.yearly.savings")}
                </span>
              )}

              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {PRICES[interval]}
                </span>
                <span
                  className={
                    highlighted ? "text-[#6b551d]" : "text-muted-foreground"
                  }
                >
                  /{t(`premium.${interval}.period`)}
                </span>
              </div>
              <p
                className={cn(
                  "mt-2 min-h-[40px] text-sm",
                  highlighted ? "text-[#6b551d]" : "text-muted-foreground"
                )}
              >
                {t(`premium.${interval}.description`)}
              </p>

              <Button
                onClick={() => handleCheckout(interval)}
                disabled={loading !== null}
                size="lg"
                className={cn(
                  "mt-6 h-11 w-full cursor-pointer border-0",
                  highlighted
                    ? "bg-[#2a2008] font-semibold text-[#f4e6b0] shadow-md hover:bg-[#3a2c0a]"
                    : "bg-foreground text-background hover:bg-foreground/90"
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

      <div className="space-y-1.5 text-center">
        <p className="text-xs text-muted-foreground">{t("billingInfo")}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground/80">
          {t("consent")}
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          <Link
            href="/cgv"
            target="_blank"
            className="underline hover:text-foreground"
          >
            {t("cgvLink")}
          </Link>
          {" · "}
          <Link
            href="/politique-confidentialite"
            target="_blank"
            className="underline hover:text-foreground"
          >
            {t("privacyLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
