import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { ForgotPasswordForm } from "@/components/ForgotPassword/forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié - Le Vestiaire Foot",
  description: "Réinitialisez votre mot de passe Le Vestiaire Foot.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo centered />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
