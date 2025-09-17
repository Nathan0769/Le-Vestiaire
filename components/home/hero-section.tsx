import { Button } from "@/components/ui/button";
import { ArrowRight, Shirt, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface HeroSectionProps {
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
  userStats?: {
    collection: { total: number };
    wishlist: { total: number };
  } | null;
}

export function HeroSection({ user, userStats }: HeroSectionProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Le Vestiaire - Votre Collection de Maillots de Football",
    description:
      "Découvrez, collectionnez et partagez votre passion pour les maillots de football. Créez votre collection personnelle et partagez avec la communauté",
    url: "https://le-vestiaire-foot.fr",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://le-vestiaire-foot.fr/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section
        className="relative min-h-[70vh] flex items-center justify-center"
        role="banner"
        aria-label="Section d'accueil - Collection de maillots de football"
      >
        <div className="absolute inset-0">
          <Image
            src="https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/logo-app/vestiaire.jpg"
            alt="Collection de maillots de football - Le Vestiaire"
            fill
            className="object-cover object-center"
            priority
            quality={85}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <header>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Bienvenue dans
              <span className="text-primary block mt-2">Le Vestiaire</span>
            </h1>

            <h2 className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Découvrez, collectionnez et partagez votre passion pour les
              maillots de football avec une communauté de collectionneurs.
            </h2>
          </header>

          {user && userStats ? (
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              itemScope
              itemType="https://schema.org/Person"
            >
              <div
                className="flex items-center gap-6 bg-card/80 backdrop-blur-sm rounded-full px-6 py-4 border border-border/50"
                role="region"
                aria-label="Statistiques de votre collection de maillots"
              >
                <div className="flex items-center gap-2 text-center">
                  <Shirt className="w-5 h-5 text-primary" aria-hidden="true" />
                  <div>
                    <div
                      className="text-2xl font-bold text-foreground"
                      itemProp="owns"
                      aria-label={`${userStats.collection.total} maillots dans votre collection`}
                    >
                      {userStats.collection.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ma Collection
                    </div>
                  </div>
                </div>

                <div className="w-px h-8 bg-border/50" role="separator" />

                <div className="flex items-center gap-2 text-center">
                  <Heart className="w-5 h-5 text-red-500" aria-hidden="true" />
                  <div>
                    <div
                      className="text-2xl font-bold text-foreground"
                      aria-label={`${userStats.wishlist.total} maillots dans votre liste d'envies`}
                    >
                      {userStats.wishlist.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mes Envies
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <nav
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              aria-label="Actions d'authentification"
            >
              <Button size="lg" asChild>
                <Link
                  href="/auth/login"
                  className="gap-2"
                  aria-label="Se connecter à votre compte Le Vestiaire"
                >
                  Se connecter
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link
                  href="/auth/signUp"
                  aria-label="Créer un compte pour commencer votre collection de maillots"
                >
                  Créer un compte
                </Link>
              </Button>
            </nav>
          )}

          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-primary"
            >
              <Link
                href="/jerseys"
                className="gap-2"
                aria-label="Découvrir tous les maillots de football disponibles"
              >
                Découvrir les maillots
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
