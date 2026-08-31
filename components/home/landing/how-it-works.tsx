import { Shirt, Gift, Trophy } from "lucide-react";

const steps = [
  {
    icon: Shirt,
    title: "Ajoute tes maillots",
    description:
      "Cherche dans le catalogue, renseigne taille, état et prix. Ta collection prend vie en quelques secondes.",
  },
  {
    icon: Gift,
    title: "Crée ta wishlist partageable",
    description:
      "Un lien à envoyer pour Noël ou ton anniversaire. Tes proches savent exactement quoi t'offrir.",
  },
  {
    icon: Trophy,
    title: "Note, compare, grimpe au classement",
    description:
      "Donne ton avis sur les maillots de ton club et mesure-toi aux autres collectionneurs du Vestiaire.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Du placard au Vestiaire
          </h2>
          <p className="mt-3.5 text-lg text-muted-foreground">
            Tes maillots rangés et partagés en 3 étapes, sans prise de tête.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative rounded-2xl border border-border bg-card p-7 shadow-sm"
              >
                <span
                  className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
