import { Package, Heart, Shield, Users } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Package,
      title: "Cataloguez votre collection",
      description:
        "Enregistrez tous vos maillots avec leurs détails : taille, état, prix d'achat, personnalisation. Suivez la valeur de votre collection.",
    },
    {
      icon: Heart,
      title: "Wishlist partageable",
      description:
        "Créez votre liste d'envies et partagez-la facilement avec vos proches pour Noël, anniversaires ou toute occasion spéciale.",
    },
    {
      icon: Shield,
      title: "Authentification des maillots",
      description:
        "Apprenez à reconnaître les vrais maillots des contrefaçons grâce à nos guides détaillés pour chaque marque (Nike, Adidas, Puma...).",
    },
    {
      icon: Users,
      title: "Communauté de passionnés",
      description:
        "Connectez-vous avec d'autres collectionneurs, partagez vos trouvailles et découvrez les collections de vos amis.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pourquoi choisir Le Vestiaire ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            L&apos;application gratuite pensée par des collectionneurs, pour des
            collectionneurs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
