"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface VisualExample {
  step: number;
  title: string;
  description: string;
  authentic: {
    image: string;
    label: string;
    points: string[];
  };
  fake: {
    image: string;
    label: string;
    points: string[];
  };
}

const ADIDAS_EXAMPLES: VisualExample[] = [
  {
    step: 1,
    title: "Exemple 1 : Étiquette avec code produit",
    description:
      "Voici comment identifier le code produit sur l'étiquette dans le col",
    authentic: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/adidas/label-real.jpg",
      label: "AUTHENTIQUE",
      points: [
        "Code produit visible : JL9623",
        "Date d'impression en lien avec l'année du maillot",
        "3 codes alignés correctement",
        "Logo Adidas bien défini",
      ],
    },
    fake: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/adidas/label-fake.jpeg",
      label: "CONTREFAÇON",
      points: [
        "Code H13881 correspond à Man United au lieu du Mexique dans notre exemple",
        "Impression floue ou mal alignée",
        "Caractères irréguliers",
      ],
    },
  },
  {
    step: 2,
    title: "Exemple 2 : Étiquette boutique",
    description: "L'étiquette cartonnée accrochée sur les maillots neufs",
    authentic: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/adidas/tag-real.jpg",
      label: "AUTHENTIQUE",
      points: [
        "Nom du club indiqué : 'OL'",
        "Mention du type : '75' (Maillot 75ans OL)",
        "Code produit visible",
        "QR Code vers le maillot correct",
      ],
    },
    fake: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/adidas/tag-fake.jpg",
      label: "CONTREFAÇON",
      points: [
        "Marqué uniquement 'adidas JSY'",
        "Pas de nom de club",
        "Code-barres incorrect",
      ],
    },
  },
];

const NIKE_EXAMPLES: VisualExample[] = [
  {
    step: 1,
    title: "Exemple 1 : Code produit et code de production",
    description:
      "La petite étiquette sous l'étiquette de lavage contient les codes essentiels",
    authentic: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/%20product-code-real.jpg",
      label: "AUTHENTIQUE",
      points: [
        "Code produit visible : 658789-426 (style + couleur)",
        "Code de production cohérent : HO150710 (Holiday 2015, juillet-octobre)",
        "Impression nette et lisible",
        "Format correct et alignement parfait",
      ],
    },
    fake: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/product-code-fake.jpg",
      label: "CONTREFAÇON",
      points: [
        "Code produit pour un autre maillot (Ici maillot PSG avec FN8721-456 = Barcelone Home 24/25)",
        "Code de production incohérent avec la saison",
        "Impression floue ou caractères irréguliers",
        "Mauvais alignement ou format incorrect",
      ],
    },
  },
  {
    step: 3,
    title: "Exemple 2 : Étiquette boutique (Swing Tag)",
    description: "L'étiquette cartonnée accrochée aux maillots neufs",
    authentic: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/tag-real.jpg",
      label: "AUTHENTIQUE",
      points: [
        "Autocollant physique (pas imprimé)",
        "Barb d'attache noir",
        "Barre de couleur de taille correcte",
        "Code produit correspond à l'étiquette interne",
        "Placement correct selon l'année (manche gauche post-2021)",
      ],
    },
    fake: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/tag-fake.jpg",
      label: "CONTREFAÇON",
      points: [
        "Autocollant imprimé (pas un vrai sticker)",
        "Barb d'attache blanc ou couleur incorrecte",
        "Barre de couleur absente ou incorrecte",
        "Code produit ne correspond pas (CD0699-100 = France 2020/22)",
      ],
    },
  },
  {
    step: 5,
    title: "Exemple 3 : Étiquette de sécurité",
    description:
      "L'étiquette en bas à droite du maillot avec code unique et bande métallique",
    authentic: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/security-tag-real.jpg",
      label: "AUTHENTIQUE",
      points: [
        "Bande métallique/holographique de qualité",
        "Effet changeant sous la lumière",
        "Code alphanumérique unique",
        "Coutures propres et régulières",
        "Accents dorés (version joueur) ou argentés (version fan)",
      ],
    },
    fake: {
      image:
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/security-tag-fake.jpg",
      label: "CONTREFAÇON",
      points: [
        "Bande plate imprimée (pas d'effet holographique)",
        "Code répété sur plusieurs maillots",
        "Coutures grossières",
        "Pas d'effet métallique",
      ],
    },
  },
];

interface VisualExampleProps {
  stepNumber: number;
  brand?: string;
}

export function VisualExample({
  stepNumber,
  brand = "adidas",
}: VisualExampleProps) {
  const t = useTranslations(`Authentication.${brand}.visualExamples`);
  const tCommon = useTranslations("Authentication.common");

  const examples = brand === "nike" ? NIKE_EXAMPLES : ADIDAS_EXAMPLES;
  const staticExample = examples.find((ex) => ex.step === stepNumber);

  if (!staticExample) return null;

  const exampleIndex = examples.findIndex((ex) => ex.step === stepNumber) + 1;
  const exampleKey = `example${exampleIndex}`;

  const title = t(`${exampleKey}.title`);
  const description = t(`${exampleKey}.description`);

  const authenticPoints = t.raw(`${exampleKey}.authentic.points`) as Record<
    string,
    string
  >;
  const authenticPointsArray = Object.values(authenticPoints);

  const fakePoints = t.raw(`${exampleKey}.fake.points`) as Record<
    string,
    string
  >;
  const fakePointsArray = Object.values(fakePoints);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Authentique */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-green-50 dark:bg-green-950/20 rounded-lg overflow-hidden border-2 border-green-200 dark:border-green-800">
              <Image
                src={staticExample.authentic.image}
                alt={tCommon("authentic")}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                {tCommon("authentic")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {authenticPointsArray.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Faux */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-red-50 dark:bg-red-950/20 rounded-lg overflow-hidden border-2 border-red-200 dark:border-red-800">
              <Image
                src={staticExample.fake.image}
                alt={tCommon("counterfeit")}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                {tCommon("counterfeit")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {fakePointsArray.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
