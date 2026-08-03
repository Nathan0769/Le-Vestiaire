import fs from 'fs';
import path from 'path';

export type LegalPageType =
  | 'politique-cookies'
  | 'politique-confidentialite'
  | 'conditions-utilisation'
  | 'mentions-legales'
  | 'cgv';

const fileMapping: Record<string, Record<LegalPageType, string>> = {
  fr: {
    'politique-cookies': 'politique-cookies.md',
    'politique-confidentialite': 'politique-confidentialite.md',
    'conditions-utilisation': 'conditions-utilisation.md',
    'mentions-legales': 'mentions-legales.md',
    'cgv': 'cgv.md',
  },
  en: {
    'politique-cookies': 'cookie-policy.md',
    'politique-confidentialite': 'privacy-policy.md',
    'conditions-utilisation': 'terms-of-service.md',
    'mentions-legales': 'legal-notice.md',
    'cgv': 'terms-of-sale.md',
  },
  es: {
    'politique-cookies': 'politica-cookies.md',
    'politique-confidentialite': 'politica-privacidad.md',
    'conditions-utilisation': 'terminos-uso.md',
    'mentions-legales': 'aviso-legal.md',
    'cgv': 'condiciones-venta.md',
  },
};

export function getLegalContent(locale: string, pageType: LegalPageType): string {
  const mapping = fileMapping[locale];
  // Fallback anglais pour les locales sans traduction dédiée (de, it, nl, pt) :
  // l'anglais est plus universel que le français pour un lecteur non francophone.
  const readEnglishFallback = () =>
    fs.readFileSync(
      path.join(process.cwd(), 'legal', 'en', fileMapping['en'][pageType]),
      'utf-8'
    );

  if (!mapping) {
    return readEnglishFallback();
  }

  const filePath = path.join(process.cwd(), 'legal', locale, mapping[pageType]);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read legal file: ${filePath}`, error);
    return readEnglishFallback();
  }
}
