"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { setConsent, declineConsent } from "@/lib/cookie-consent";

interface CookieConsentProps extends React.HTMLAttributes<HTMLDivElement> {
  demo?: boolean;
  onAcceptCallback?: () => void;
  onDeclineCallback?: () => void;
  description?: string;
  learnMoreHref?: string;
}

/**
 * Thin consent bar: full-width at the bottom on mobile (most visitors land on
 * a jersey page from Google, the bar must not hide the photo or the price),
 * small card in the bottom-left corner from `sm` up.
 * Refuse and accept share the same variant and size: the CNIL requires
 * refusing to be as easy and visible as accepting.
 */
const CookieConsent = React.forwardRef<HTMLDivElement, CookieConsentProps>(
  (
    {
      demo = false,
      onAcceptCallback = () => {},
      onDeclineCallback = () => {},
      className,
      description,
      learnMoreHref = "#",
      ...props
    },
    ref
  ) => {
    const t = useTranslations("CookieConsent");
    const [isOpen, setIsOpen] = React.useState(false);
    const [hide, setHide] = React.useState(false);

    const handleAccept = React.useCallback(() => {
      setIsOpen(false);
      setConsent(true, true);
      setTimeout(() => {
        setHide(true);
      }, 700);
      onAcceptCallback();
    }, [onAcceptCallback]);

    const handleDecline = React.useCallback(() => {
      setIsOpen(false);
      declineConsent();
      setTimeout(() => {
        setHide(true);
      }, 700);
      onDeclineCallback();
    }, [onDeclineCallback]);

    React.useEffect(() => {
      try {
        setIsOpen(true);
        const hasBase = document.cookie.includes("cookieConsent=true");
        const hasAdvertising =
          document.cookie.includes("cookieConsentAdvertising=true") ||
          document.cookie.includes("cookieConsentAdvertising=false");
        if (hasBase && hasAdvertising && !demo) {
          setIsOpen(false);
          setTimeout(() => {
            setHide(true);
          }, 700);
        }
      } catch (error) {
        console.warn("Cookie consent error:", error);
      }
    }, [demo]);

    if (hide) return null;

    return (
      <div
        ref={ref}
        role="region"
        aria-label={t("ariaLabel")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 transition-all duration-700",
          "sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-full sm:max-w-sm",
          !isOpen ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex flex-col gap-2 border-t bg-card text-card-foreground shadow-lg",
            "px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]",
            "sm:gap-3 sm:rounded-xl sm:border sm:p-4"
          )}
        >
          <p className="text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-5">
            {description || t("message")}{" "}
            <a
              href={learnMoreHref}
              className="whitespace-nowrap text-foreground underline underline-offset-2 hover:no-underline"
            >
              {t("learnMore")}
            </a>
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {t("decline")}
            </Button>
            <Button
              onClick={handleAccept}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {t("accept")}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

CookieConsent.displayName = "CookieConsent";
export { CookieConsent };
export default CookieConsent;
