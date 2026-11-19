import { render } from "@react-email/components";
import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/locales";
import { APP_URL, buildUnsubscribeUrl } from "@/lib/email";
import type { ReminderStep } from "@/lib/reminders";
import { ReminderNoJerseyEmail } from "@/emails/reminder-no-jersey";

/**
 * E-mail de relance « collection vide » dans la langue du compte.
 * Textes : messages/*.json, `Emails.reminders.d{1,7,30}`, `Emails.common` et `Emails.footer`.
 */
export async function buildReminderEmail(input: {
  step: ReminderStep;
  locale: Locale;
  userId: string;
  userName: string;
  /** Nombre de maillots au catalogue, cité dans J+1 */
  catalogCount: number;
}): Promise<{ subject: string; html: string }> {
  const { step, locale, userId, userName, catalogCount } = input;
  // Hors requête (cron) : messages chargés directement, sans la config de requête next-intl
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const t = createTranslator({ locale, messages, namespace: `Emails.reminders.d${step}` });
  const common = createTranslator({ locale, messages, namespace: "Emails.common" });
  const footer = createTranslator({ locale, messages, namespace: "Emails.footer" });

  const html = await render(
    ReminderNoJerseyEmail({
      lang: locale,
      texts: {
        preview: t("preview"),
        tagline: common("tagline"),
        kicker: t("kicker"),
        title: t("title"),
        intro: t("intro", { name: userName, count: catalogCount }),
        features: ([1, 2, 3] as const).map((n) => ({ title: t(`f${n}Title`), text: t(`f${n}Text`) })),
        stepsTitle: common("stepsTitle"),
        steps: [common("step1"), common("step2"), common("step3")],
        cta: t("cta"),
        footerReason: footer("reason"),
        unsubscribe: footer("unsubscribe"),
      },
      // L'ajout se fait depuis la fiche d'un maillot : le bouton ouvre le catalogue
      ctaUrl: `${APP_URL}/${locale}/jerseys`,
      unsubscribeUrl: buildUnsubscribeUrl(userId),
    })
  );

  return { subject: t("subject"), html };
}
