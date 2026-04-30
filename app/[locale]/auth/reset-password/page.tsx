import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { ResetPasswordForm } from "@/components/ResetPassword/reset-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe - Le Vestiaire Foot",
  description: "Choisissez un nouveau mot de passe pour votre compte.",
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo centered />
        <ResetPasswordForm token={token ?? null} />
      </div>
    </div>
  );
}
