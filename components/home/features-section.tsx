"use client";

import { Package, Heart, Shield, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

export function FeaturesSection() {
  const t = useTranslations("HomePage.features");
  const params = useParams();
  const locale = (params?.locale as string) || "fr";

  const features = [
    {
      icon: Package,
      key: "catalogCollection",
    },
    {
      icon: Heart,
      key: "shareableWishlist",
    },
    {
      icon: Shield,
      key: "authentication",
    },
    {
      icon: Users,
      key: "community",
    },
  ] as const;

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.key}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.key === "authentication"
                    ? t.rich("authentication.description", {
                        br: () => <br />,
                        link: (chunks) => (
                          <Link
                            href={`/${locale}/authentification`}
                            className="text-primary font-medium hover:opacity-80 transition-opacity"
                          >
                            {chunks}
                          </Link>
                        ),
                      })
                    : t(`${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
