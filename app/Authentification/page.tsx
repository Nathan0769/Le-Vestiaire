// app/auth/signup/page.tsx
"use client";

import { GalleryVerticalEnd } from "lucide-react";
import CreateAccount from "@/components/Authentification/create-account";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo / Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="h-4 w-4" />
          </div>
          Le Vestiaire
        </Link>

        {/* Your full signup form component */}
        <CreateAccount />
      </div>
    </div>
  );
}
