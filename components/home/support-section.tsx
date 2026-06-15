"use client";

import { useTranslations } from "next-intl";
import { Coffee, Flame } from "lucide-react";
import { BUY_ME_A_COFFEE_URL, TIPEEE_URL } from "@/lib/support-links";

export function SupportSection() {
  const t = useTranslations("HomePage.support");

  return (
    <section className="py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-3">{t("title")}</h2>
        <p className="text-muted-foreground mb-8">{t("subtitle")}</p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center justify-center gap-2 w-52 py-3 rounded-lg bg-[#FFDD00] text-black font-semibold hover:opacity-90 transition-opacity"
          >
            <Coffee className="h-5 w-5 shrink-0" />
            Buy me a coffee
          </a>
          <a
            href={TIPEEE_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center justify-center gap-2 w-52 py-3 rounded-lg bg-[#ED1C24] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Flame className="h-5 w-5 shrink-0" />
            {t("tipeee")}
          </a>
        </div>
        <p className="text-sm text-muted-foreground">{t("thanks")}</p>
      </div>
    </section>
  );
}
