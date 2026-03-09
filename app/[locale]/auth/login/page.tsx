import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/Login/login-form";

export const metadata: Metadata = {
  title: "Connexion - Le Vestiaire Foot",
  description: "Connectez-vous à votre compte Le Vestiaire Foot.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo centered />
        <LoginForm />
      </div>
    </div>
  );
}
