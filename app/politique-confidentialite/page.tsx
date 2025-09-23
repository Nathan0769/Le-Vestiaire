import Link from "next/link";

export const metadata = {
  title: "Politique de Confidentialité - Le Vestiaire",
  description: "Politique de protection des données personnelles",
  robots: "noindex, follow",
};

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Politique de Confidentialité
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
                1. Informations générales
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Le Vestiaire (accessible via le-vestiaire-foot.fr) est une
                application web de collection de maillots de football développée
                et opérée par Nathan Rivollier. Cette politique explique comment
                nous collectons, utilisons et protégeons vos données
                personnelles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Données collectées
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Données d&apos;inscription
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Adresse email</li>
                <li>Nom d&apos;utilisateur</li>
                <li>Photo de profil (optionnelle)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Données d&apos;utilisation
              </h3>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Maillots ajoutés à votre collection personnelle</li>
                <li>Maillots ajoutés à votre wishlist</li>
                <li>Notes personnelles sur vos maillots</li>
                <li>Évaluations publiques des maillots (notes moyennes)</li>
                <li>Données de navigation via Vercel Analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Base légale du traitement
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous traitons vos données sur la base de :
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>
                  <strong>Votre consentement</strong> : Pour l&apos;inscription
                  et l&apos;utilisation du service
                </li>
                <li>
                  <strong>Intérêt légitime</strong> : Pour l&apos;amélioration
                  du service et les analytics
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Utilisation des données
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vos données sont utilisées pour :
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Fournir et maintenir le service de collection</li>
                <li>Gérer votre compte utilisateur</li>
                <li>
                  Calculer les notes moyennes des maillots (données agrégées)
                </li>
                <li>
                  Améliorer l&apos;expérience utilisateur via les analytics
                </li>
                <li>Vous contacter concernant votre compte si nécessaire</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Partage des données
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Données publiques
              </h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  Vos évaluations des maillots contribuent aux notes moyennes
                  publiques
                </li>
                <li>
                  À l&apos;avenir : possibilité de partage de collections entre
                  amis
                </li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Prestataires techniques
              </h3>
              <p className="text-gray-700 mb-3">
                Nous partageons certaines données avec nos prestataires :
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>
                  <strong>Google</strong> : Authentification OAuth (email, nom,
                  photo)
                </li>
                <li>
                  <strong>Vercel</strong> : Hébergement et analytics (données de
                  navigation)
                </li>
                <li>
                  <strong>Neon</strong> : Base de données PostgreSQL (toutes
                  données utilisateur)
                </li>
                <li>
                  <strong>Supabase</strong> : Stockage des images de profil
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Transferts internationaux
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Vos données peuvent être transférées vers des pays hors Union
                Européenne via nos prestataires (États-Unis principalement). Ces
                transferts sont encadrés par des clauses contractuelles types ou
                des décisions d&apos;adéquation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Durée de conservation
              </h2>
              <ul className="list-disc pl-6 text-gray-700">
                <li>
                  <strong>Compte actif</strong> : Conservation indéfinie tant
                  que votre compte existe
                </li>
                <li>
                  <strong>Authentification Google</strong> : Reconnexion requise
                  tous les 14 jours
                </li>
                <li>
                  <strong>Suppression</strong> : Suppression complète sur
                  demande de votre part
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Vos droits
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  <strong>Accès</strong> : Obtenir une copie de vos données
                </li>
                <li>
                  <strong>Rectification</strong> : Corriger vos données
                  inexactes
                </li>
                <li>
                  <strong>Suppression</strong> : Demander la suppression de
                  votre compte
                </li>
                <li>
                  <strong>Portabilité</strong> : Récupérer vos données dans un
                  format lisible
                </li>
                <li>
                  <strong>Opposition</strong> : Vous opposer au traitement pour
                  motif légitime
                </li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-primary">
                  <strong>Pour exercer vos droits, contactez-nous à :</strong>{" "}
                  <a
                    href="mailto:contact.levestiaire.foot@gmail.com"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    contact.levestiaire.foot@gmail.com
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Sécurité
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nous mettons en place des mesures techniques appropriées pour
                protéger vos données, incluant l&apos;authentification sécurisée
                et le chiffrement des connexions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Évolution de la politique
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Cette politique peut évoluer. Les modifications importantes vous
                seront notifiées par email ou via l&apos;application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Contact
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800">
                  <strong>
                    Pour toute question relative à cette politique :
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
