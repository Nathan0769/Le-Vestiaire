import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/Login/login-form";

export const metadata: Metadata = {
  title: "Connexion - Le Vestiaire Foot",
  description: "Connectez-vous à votre compte Le Vestiaire Foot.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo centered />
        <LoginForm returnTo={returnTo} />
      </div>
    </div>
  );
}
