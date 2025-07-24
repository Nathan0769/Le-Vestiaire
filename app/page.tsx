"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-10">
        <h1 className="text-3xl font-bold">Bienvenue sur Le Vestiaire</h1>
        <p className="text-muted-foreground text-center max-w-xl">
          Connectez-vous ou créez un compte pour découvrir notre collection.
        </p>
        <div className="flex gap-4">
          <Button
            className="cursor-pointer"
            onClick={() => router.push("/auth/login")}
          >
            Se connecter
          </Button>

          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => router.push("/auth/signUp")}
          >
            Créer un compte
          </Button>
        </div>
      </main>
    </div>
  );
}
