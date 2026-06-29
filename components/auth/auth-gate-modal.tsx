"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleIcon } from "@/components/icons/Google-icon";
import { useAuth } from "@/hooks/useAuth";
import { buildAuthUrl, type AuthGateIntent } from "@/lib/auth-gate";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: AuthGateIntent;
  jersey: {
    name: string;
    imageUrl: string;
  };
  returnTo: string;
}

export function AuthGateModal({
  open,
  onOpenChange,
  intent,
  jersey,
  returnTo,
}: AuthGateModalProps) {
  const t = useTranslations("AuthGate");
  const router = useRouter();
  const { signInWithGoogle } = useAuth();

  const handleGoogle = async () => {
    try {
      await signInWithGoogle(returnTo);
    } catch (err) {
      console.error("AuthGate Google error:", err);
    }
  };

  const handleEmail = () => {
    router.push(buildAuthUrl("signUp", returnTo));
  };

  const handleSignIn = () => {
    router.push(buildAuthUrl("login", returnTo));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={jersey.imageUrl}
                alt={jersey.name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left text-base">
                {t(`intent.${intent}.title`)}
              </DialogTitle>
              <DialogDescription className="text-left text-xs mt-1 line-clamp-1">
                {jersey.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground py-2">
          {t(`intent.${intent}.promise`)}
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={handleGoogle} className="w-full cursor-pointer" type="button">
            <GoogleIcon />
            <span className="ml-2">{t("continueWithGoogle")}</span>
          </Button>
          <Button
            onClick={handleEmail}
            variant="outline"
            className="w-full cursor-pointer"
            type="button"
          >
            <Mail className="h-4 w-4" />
            <span className="ml-2">{t("continueWithEmail")}</span>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground pt-2">
          {t("alreadyAccount")}{" "}
          <button
            type="button"
            onClick={handleSignIn}
            className="underline underline-offset-4 hover:text-foreground cursor-pointer"
          >
            {t("signIn")}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
