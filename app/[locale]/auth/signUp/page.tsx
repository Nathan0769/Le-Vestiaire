import type { Metadata } from "next";
import CreateAccount from "@/components/signUp/create-account";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Créer un compte - Le Vestiaire Foot",
  description: "Créez votre compte gratuit sur Le Vestiaire Foot.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo centered />

        <CreateAccount returnTo={returnTo} />
      </div>
    </div>
  );
}
