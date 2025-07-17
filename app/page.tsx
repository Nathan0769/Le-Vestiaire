"use client";

import { ModeToggle } from "@/components/ui/toggle-dark-mode";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-10">
        <h1 className="text-3xl font-bold">Bienvenue sur Le Vestiaire</h1>
        <p className="text-muted-foreground text-center max-w-xl">
          Connectez-vous ou créez un compte pour découvrir notre collection.
        </p>
        <div className="flex gap-4">
          <a
            href="/auth/login"
            className="bg-primary text-white px-4 py-2 rounded-md"
          >
            Se connecter
          </a>
          <a
            href="/auth/signUp"
            className="bg-muted text-foreground px-4 py-2 rounded-md border"
          >
            Créer un compte
          </a>
          <ModeToggle></ModeToggle>
        </div>
      </main>
    </div>
  );
}
