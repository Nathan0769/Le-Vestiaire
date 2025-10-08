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
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/puma/label-real.jpg",
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
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/puma/label-fake.jpeg",
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
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/puma/tag-real.jpg",
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
        "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/puma/tag-fake.jpg",
      label: "CONTREFAÇON",
      points: [
        "Marqué uniquement 'adidas JSY'",
        "Pas de nom de club",
        "Code-barres incorrect",
      ],
    },
  },
];

interface VisualExampleProps {
  stepNumber: number;
}

export function VisualExample({ stepNumber }: VisualExampleProps) {
  const example = ADIDAS_EXAMPLES.find((ex) => ex.step === stepNumber);

  if (!example) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{example.title}</CardTitle>
        <CardDescription>{example.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Authentique */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-green-50 dark:bg-green-950/20 rounded-lg overflow-hidden border-2 border-green-200 dark:border-green-800">
              <Image
                src={example.authentic.image}
                alt={example.authentic.label}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                {example.authentic.label}
              </div>
              <ul className="space-y-1.5 text-sm">
                {example.authentic.points.map((point, i) => (
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
                src={example.fake.image}
                alt={example.fake.label}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                {example.fake.label}
              </div>
              <ul className="space-y-1.5 text-sm">
                {example.fake.points.map((point, i) => (
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
