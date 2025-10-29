import Link from "next/link";

export const metadata = {
  title: "Conditions d'Utilisation - Le Vestiaire",
  description: "Conditions générales d'utilisation du service",
  robots: "noindex, follow",
};

export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Conditions d&apos;Utilisation
          </h1>
          <p className="text-gray-600 mt-2">
            Dernière mise à jour : 23 septembre 2025
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Présentation du service
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Le Vestiaire est une application web gratuite permettant de
                cataloguer, collectionner et évaluer des maillots de football.
                Le service est actuellement proposé gratuitement avec
                possibilité d&apos;évolution vers un modèle freemium.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Acceptation des conditions
              </h2>
              <p className="text-gray-700 leading-relaxed">
                L&apos;utilisation du service implique l&apos;acceptation pleine
                et entière de ces conditions d&apos;utilisation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Inscription et compte utilisateur
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Conditions d&apos;inscription
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Être âgé d&apos;au moins 16 ans</li>
                <li>Fournir des informations exactes et à jour</li>
                <li>Maintenir la confidentialité de vos identifiants</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Responsabilité du compte
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Vous êtes responsable de toute activité effectuée depuis votre
                compte.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Utilisation autorisée
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Usages permis
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Créer et gérer votre collection personnelle de maillots</li>
                <li>Ajouter des maillots à votre wishlist</li>
                <li>Noter et évaluer les maillots</li>
                <li>Ajouter des notes personnelles sur vos maillots</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Usages interdits
              </h3>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Utilisation à des fins commerciales sans autorisation</li>
                <li>Tentative de piratage ou d&apos;altération du service</li>
                <li>
                  Création de faux comptes ou manipulation des évaluations
                </li>
                <li>Publication de contenu illégal ou offensant</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Contenu utilisateur
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Vos contributions
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Vous conservez la propriété de vos données personnelles</li>
                <li>
                  Vous accordez une licence d&apos;utilisation pour les
                  évaluations publiques
                </li>
                <li>Vos notes personnelles restent privées</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Responsabilité du contenu
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Vous êtes responsable du contenu que vous publiez et garantissez
                qu&apos;il ne porte atteinte à aucun droit de tiers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Propriété intellectuelle
              </h2>
              <ul className="list-disc pl-6 text-gray-700">
                <li>
                  Le code source et le design du site restent notre propriété
                </li>
                <li>
                  La base de données des maillots est constituée à des fins
                  d&apos;information
                </li>
                <li>
                  Les marques et logos de clubs appartiennent à leurs
                  propriétaires respectifs
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Évolution du service
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Modifications
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Nous nous réservons le droit de :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Modifier les fonctionnalités du service</li>
                <li>Introduire des fonctionnalités premium</li>
                <li>Ajouter de la publicité</li>
                <li>Suspendre temporairement le service pour maintenance</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Notification
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Les changements majeurs vous seront notifiés à l&apos;avance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Résiliation
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                De votre part
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vous pouvez supprimer votre compte à tout moment en nous
                contactant.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                De notre part
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Nous pouvons suspendre votre compte en cas de non-respect de ces
                conditions, avec préavis sauf urgence.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Limitation de responsabilité
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Le service est fourni &quot;en l&apos;état&quot;. Nous ne
                garantissons pas :
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>La disponibilité continue du service</li>
                <li>
                  L&apos;exactitude complète des informations sur les maillots
                </li>
                <li>La sécurité absolue contre les intrusions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Données personnelles
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Le traitement de vos données personnelles est régi par notre
                Politique de Confidentialité, que vous acceptez en utilisant le
                service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Droit applicable
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Ces conditions sont régies par le droit français. Tout litige
                sera soumis aux tribunaux compétents français.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contact
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800">
                  <strong>
                    Pour toute question relative à ces conditions :
                  </strong>
                </p>
                <p className="mt-2">
                  <a
                    href="mailto:contact.levestiaire.foot@gmail.com"
                    className="text-primary hover:underline font-medium"
                  >
                    contact.levestiaire.foot@gmail.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Link
          href="/"
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/70 transition-colors inline-flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
