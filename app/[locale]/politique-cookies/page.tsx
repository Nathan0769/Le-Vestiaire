import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Cookies - Le Vestiaire Foot",
  description:
    "Découvrez comment Le Vestiaire utilise les cookies pour améliorer votre expérience.",
};

export default function PolitiqueCookiesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Politique de Cookies</h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Qu&apos;est-ce qu&apos;un cookie ?
          </h2>
          <p>
            Un cookie est un petit fichier texte stocké sur votre appareil
            lorsque vous visitez un site web. Les cookies nous aident à offrir
            une meilleure expérience utilisateur et à améliorer nos services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Cookies utilisés sur Le Vestiaire
          </h2>

          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-2">
                1. Cookies strictement nécessaires
              </h3>
              <p className="mb-2">
                Ces cookies sont essentiels au fonctionnement du site et ne
                peuvent pas être désactivés.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Cookies d&apos;authentification :</strong> Permettent
                  de vous connecter et maintenir votre session active
                </li>
                <li>
                  <strong>cookieConsent :</strong> Mémorise votre choix
                  concernant les cookies
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-2">
                2. Cookies d&apos;analyse et de performance
              </h3>
              <p className="mb-2">
                Ces cookies nous aident à comprendre comment vous utilisez le
                site pour améliorer nos services.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Vercel Analytics :</strong> Analyse du trafic et du
                  comportement des utilisateurs
                </li>
                <li>
                  <strong>Vercel Speed Insights :</strong> Mesure des
                  performances du site
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Vous pouvez refuser ces cookies via la bannière de consentement
                sans affecter votre expérience de navigation.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Gestion de vos préférences
          </h2>
          <p className="mb-4">
            Vous pouvez à tout moment modifier vos préférences concernant les
            cookies :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              En supprimant les cookies depuis les paramètres de votre
              navigateur
            </li>
            <li>
              En effaçant le cookie &quot;cookieConsent&quot; pour faire
              réapparaître la bannière
            </li>
            <li>
              En contactant notre équipe à{" "}
              <a
                href="mailto:contact.levestiaire.foot@gmail.com"
                className="text-primary hover:underline"
              >
                contact.levestiaire.foot@gmail.com
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Durée de conservation</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Cookies de session :</strong> Supprimés à la fermeture du
              navigateur
            </li>
            <li>
              <strong>Cookie de consentement :</strong> Conservé jusqu&apos;en
              2099 ou jusqu&apos;à suppression manuelle
            </li>
            <li>
              <strong>Cookies d&apos;analytics :</strong> 13 mois maximum
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Vos droits (RGPD)
          </h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données
            (RGPD), vous disposez d&apos;un droit d&apos;accès, de
            rectification et de suppression de vos données personnelles. Pour
            exercer ces droits, contactez-nous à{" "}
            <a
              href="mailto:contact@le-vestiaire-foot.fr"
              className="text-primary hover:underline"
            >
              contact@le-vestiaire-foot.fr
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Modifications de cette politique
          </h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de cookies
            à tout moment. Les modifications prendront effet dès leur
            publication sur cette page. Nous vous encourageons à consulter
            régulièrement cette page.
          </p>
        </section>
      </div>
    </div>
  );
}
