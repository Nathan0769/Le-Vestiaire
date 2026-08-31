import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="px-6 py-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 85% 120%, rgba(255,255,255,.14), transparent 60%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Prêt à donner une vraie place à ta collection ?
          </h2>
          <p className="mx-auto mt-3.5 max-w-xl text-lg text-primary-foreground/80">
            Rejoins les collectionneurs du Vestiaire. C&apos;est gratuit, et ta
            première fiche prend deux minutes.
          </p>
          <Button
            size="lg"
            asChild
            className="mt-7 gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Link href="/auth/signUp">
              Créer un compte
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-primary-foreground/70">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              Connecte-toi
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
