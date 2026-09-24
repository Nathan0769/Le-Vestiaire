"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const GOLD = "text-[oklch(0.66_0.11_88)] dark:text-[oklch(0.82_0.11_90)]";
const GOLD_HEX = "oklch(0.72 0.115 90)";

const STORAGE_KEY = "mv-promo";
const MESSAGE_COUNT = 3; // popup.m1/m2/m3
const COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000; // 5 jours entre deux apparitions
const OPEN_DELAY_MS = 1400;

interface PromoState {
  shows: number; // nombre de fois déjà affiché (= prochain index de message)
  lastShown: number;
}

function readState(): PromoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PromoState;
  } catch {
    /* ignore */
  }
  return { shows: 0, lastShown: 0 };
}

/**
 * Pop-up d'auto-promo de la feature Valeur, sur la homepage.
 * Cible : utilisateurs CONNECTÉS non-Supporters (la conversion). Parcimonie :
 * au plus une fois tous les 5 jours, message différent à chaque apparition,
 * et on s'arrête après avoir montré les 3 messages.
 */
export function HomeValuePopup() {
  const t = useTranslations("MarketValue");
  const user = useCurrentUser();
  const isSupporter = !!user?.isSupporter;
  const [open, setOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // On ne cible que les connectés non-Supporters.
    if (!user || isSupporter) return;

    const state = readState();
    if (state.shows >= MESSAGE_COUNT) return; // tous les messages ont été vus
    if (Date.now() - state.lastShown < COOLDOWN_MS) return; // cooldown

    const timer = setTimeout(() => {
      setMsgIndex(state.shows);
      setOpen(true);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ shows: state.shows + 1, lastShown: Date.now() })
        );
      } catch {
        /* ignore */
      }
    }, OPEN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [user, isSupporter]);

  if (!user || isSupporter) return null;

  const n = msgIndex + 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="relative overflow-hidden border-b bg-[oklch(0.72_0.115_90)]/10 px-6 pt-7 pb-6">
          <svg
            viewBox="0 0 320 70"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-16 w-full opacity-60"
            aria-hidden
          >
            <defs>
              <linearGradient id="mvpopup-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD_HEX} stopOpacity="0.35" />
                <stop offset="100%" stopColor={GOLD_HEX} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,58 C50,54 70,44 110,42 C150,40 170,24 210,18 C250,12 280,8 320,4 L320,70 L0,70 Z" fill="url(#mvpopup-fill)" />
            <path d="M0,58 C50,54 70,44 110,42 C150,40 170,24 210,18 C250,12 280,8 320,4" fill="none" stroke={GOLD_HEX} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="relative text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("title")}
            </p>
            <p className={`mt-1 select-none text-4xl font-extrabold tabular-nums blur-[7px] ${GOLD}`}>
              2 341 €
            </p>
          </div>
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur">
            <Lock className="h-3 w-3" /> {t("supporterPill")}
          </span>
        </div>

        <div className="px-6 pb-6 pt-4">
          <DialogHeader>
            <DialogTitle className="text-xl">{t(`popup.m${n}t`)}</DialogTitle>
            <DialogDescription>{t(`popup.m${n}s`)}</DialogDescription>
          </DialogHeader>
          <Button asChild className="mt-5 w-full">
            <Link href="/soutien">{t("home.unlock")}</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("later")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
