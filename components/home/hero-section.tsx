"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Shirt, Heart } from "lucide-react";
import Link from "next/link";

interface HeroSectionProps {
  userStats?: {
    collection: { total: number };
    wishlist: { total: number };
  } | null;
}

export function HeroSection({ userStats }: HeroSectionProps) {
  const { user } = useAuth();

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center">
      {/* Background Image avec overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/Image.jpg")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
          Bienvenue dans
          <span className="text-primary block mt-2">Le Vestiaire</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Découvrez, collectionnez et partagez votre passion pour les maillots
          de foot.
        </p>

        {/* Si utilisateur connecté */}
        {user && userStats ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-6 bg-card/80 backdrop-blur-sm rounded-full px-6 py-4 border border-border/50">
              <div className="flex items-center gap-2 text-center">
                <Shirt className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {userStats.collection.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Collection
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-border/50" />

              <div className="flex items-center gap-2 text-center">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {userStats.wishlist.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Envies</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Si utilisateur non connecté */
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" asChild>
              <Link href="/auth/login" className="gap-2">
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signUp">Créer un compte</Link>
            </Button>
          </div>
        )}

        {/* CTA vers découverte */}
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-primary"
          >
            <Link href="/jerseys" className="gap-2">
              Découvrir les maillots
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
