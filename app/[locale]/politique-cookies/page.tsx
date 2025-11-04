import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Politique de Cookies - Le Vestiaire Foot",
  description:
    "Découvrez comment Le Vestiaire utilise les cookies pour améliorer votre expérience.",
};

export default async function PolitiqueCookiesPage() {
  const t = await getTranslations("CookiesPolicy");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{t("title")}</h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          {t("lastUpdate")} : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {t("whatIsCookie.title")}
          </h2>
          <p>{t("whatIsCookie.description")}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {t("cookiesUsed.title")}
          </h2>

          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-2">
                {t("cookiesUsed.necessary.title")}
              </h3>
              <p className="mb-2">{t("cookiesUsed.necessary.description")}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>{t("cookiesUsed.necessary.auth.label")}:</strong>{" "}
                  {t("cookiesUsed.necessary.auth.description")}
                </li>
                <li>
                  <strong>{t("cookiesUsed.necessary.consent.label")}:</strong>{" "}
                  {t("cookiesUsed.necessary.consent.description")}
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-2">
                {t("cookiesUsed.analytics.title")}
              </h3>
              <p className="mb-2">{t("cookiesUsed.analytics.description")}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>{t("cookiesUsed.analytics.vercel.label")}:</strong>{" "}
                  {t("cookiesUsed.analytics.vercel.description")}
                </li>
                <li>
                  <strong>{t("cookiesUsed.analytics.insights.label")}:</strong>{" "}
                  {t("cookiesUsed.analytics.insights.description")}
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                {t("cookiesUsed.analytics.optOut")}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {t("preferences.title")}
          </h2>
          <p className="mb-4">{t("preferences.description")}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t("preferences.options.browser")}</li>
            <li>{t("preferences.options.banner")}</li>
            <li>
              {t("preferences.options.contact")}{" "}
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
          <h2 className="text-2xl font-semibold mb-4">
            {t("retention.title")}
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>{t("retention.session.label")}:</strong>{" "}
              {t("retention.session.description")}
            </li>
            <li>
              <strong>{t("retention.consent.label")}:</strong>{" "}
              {t("retention.consent.description")}
            </li>
            <li>
              <strong>{t("retention.analytics.label")}:</strong>{" "}
              {t("retention.analytics.description")}
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("rights.title")}</h2>
          <p>
            {t("rights.description")}{" "}
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
            {t("modifications.title")}
          </h2>
          <p>{t("modifications.description")}</p>
        </section>
      </div>
    </div>
  );
}
