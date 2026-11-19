"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthGateModal } from "@/components/auth/auth-gate-modal";
import { buildSignupCardReturnTo, type AuthGateIntent } from "@/lib/auth-gate";

interface JerseySignupCardProps {
  jersey: { id: string; name: string; imageUrl: string };
}

/**
 * Encart d'inscription de la fiche maillot, à la place des boutons collection
 * et wishlist pour le visiteur sans compte (spec docs/specs/2026-11-19-encart-fiche.md).
 * La page ne le rend que sans cookie de session : pas de requête en plus, pas
 * de saut de mise en page. Aucun suivi de clic : la mesure passe par la source
 * d'inscription (`ref=fiche-encart` dans returnTo).
 */
export function JerseySignupCard({ jersey }: JerseySignupCardProps) {
  const t = useTranslations("JerseySignupCard");
  const pathname = usePathname();
  const [gate, setGate] = useState<{ intent: AuthGateIntent; returnTo: string } | null>(null);

  const open = (intent: AuthGateIntent) =>
    setGate({ intent, returnTo: buildSignupCardReturnTo(pathname, intent, window.location.search) });

  return (
    <section aria-label={t("label")} className="flex flex-col gap-4 min-w-0">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
        <div className="flex flex-col gap-2 min-w-0">
          <p className="text-sm font-medium text-foreground">{t("ownTitle")}</p>
          <Button
            type="button"
            onClick={() => open("add_collection")}
            className="w-full h-11 font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer xl:mt-auto"
          >
            {t("ownAction")}
          </Button>
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <p className="text-sm font-medium text-foreground">{t("wantTitle")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => open("add_wishlist")}
            className="w-full h-11 font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer xl:mt-auto"
          >
            <Heart className="w-4 h-4" aria-hidden />
            {t("wantAction")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <p>{t("free")}</p>
        <p className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span>
            {t.rich("teaser", {
              // Montant factice flouté : aucune vraie valeur dans le HTML.
              amount: (chunks) => (
                <>
                  <span aria-hidden className="inline-block select-none font-semibold text-foreground blur-[4px]">
                    {chunks}
                  </span>
                  <span className="sr-only">{t("hiddenAmount")}</span>
                </>
              ),
              plan: (chunks) => (
                <span className="font-semibold text-amber-700 dark:text-amber-400">{chunks}</span>
              ),
            })}
          </span>
        </p>
      </div>

      {gate && (
        <AuthGateModal
          open
          onOpenChange={(next) => !next && setGate(null)}
          intent={gate.intent}
          jersey={jersey}
          returnTo={gate.returnTo}
        />
      )}
    </section>
  );
}
