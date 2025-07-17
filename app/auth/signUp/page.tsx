"use client";

import CreateAccount from "@/components/signUp/create-account";
import { Logo } from "@/components/ui/Logo";

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo centered />

        <CreateAccount />
      </div>
    </div>
  );
}
