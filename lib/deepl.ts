export type DescriptionLocale = "fr" | "en" | "es" | "de" | "pt" | "it" | "nl";

export type DescriptionTranslations = Partial<Record<DescriptionLocale, string>>;

const LOCALE_TO_DEEPL: Record<DescriptionLocale, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
  de: "DE",
  pt: "PT",
  it: "IT",
  nl: "NL",
};

export const ALL_DESCRIPTION_LOCALES: DescriptionLocale[] = [
  "fr",
  "en",
  "es",
  "de",
  "pt",
  "it",
  "nl",
];

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

async function translateTo(text: string, targetLang: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error("DEEPL_API_KEY is not set");

  const response = await fetch(DEEPL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [text], target_lang: targetLang }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.translations[0].text as string;
}

export async function translateDescription(
  text: string,
  targetLocales: DescriptionLocale[] = ALL_DESCRIPTION_LOCALES
): Promise<DescriptionTranslations> {
  const entries = await Promise.all(
    targetLocales.map(async (locale) => {
      const translated = await translateTo(text, LOCALE_TO_DEEPL[locale]);
      return [locale, translated] as const;
    })
  );

  return Object.fromEntries(entries) as DescriptionTranslations;
}
