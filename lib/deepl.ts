export type DescriptionTranslations = {
  fr?: string;
  en?: string;
  es?: string;
  de?: string;
  pt?: string;
};

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
  text: string
): Promise<DescriptionTranslations> {
  const [fr, en, es, de, pt] = await Promise.all([
    translateTo(text, "FR"),
    translateTo(text, "EN"),
    translateTo(text, "ES"),
    translateTo(text, "DE"),
    translateTo(text, "PT"),
  ]);

  return { fr, en, es, de, pt };
}
