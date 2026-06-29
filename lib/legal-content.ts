import fs from 'fs';
import path from 'path';

export type LegalPageType = 'politique-cookies' | 'politique-confidentialite' | 'conditions-utilisation';

const fileMapping: Record<string, Record<LegalPageType, string>> = {
  fr: {
    'politique-cookies': 'politique-cookies.md',
    'politique-confidentialite': 'politique-confidentialite.md',
    'conditions-utilisation': 'conditions-utilisation.md',
  },
  en: {
    'politique-cookies': 'cookie-policy.md',
    'politique-confidentialite': 'privacy-policy.md',
    'conditions-utilisation': 'terms-of-service.md',
  },
  es: {
    'politique-cookies': 'politica-cookies.md',
    'politique-confidentialite': 'politica-privacidad.md',
    'conditions-utilisation': 'terminos-uso.md',
  },
};

export function getLegalContent(locale: string, pageType: LegalPageType): string {
  const mapping = fileMapping[locale];
  const readFrenchFallback = () =>
    fs.readFileSync(
      path.join(process.cwd(), 'legal', 'fr', fileMapping['fr'][pageType]),
      'utf-8'
    );

  if (!mapping) {
    return readFrenchFallback();
  }

  const filePath = path.join(process.cwd(), 'legal', locale, mapping[pageType]);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read legal file: ${filePath}`, error);
    return readFrenchFallback();
  }
}
