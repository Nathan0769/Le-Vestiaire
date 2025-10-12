import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const faqs = [
    {
      question: "Comment ajouter un maillot à ma collection ?",
      answer:
        "C'est très simple ! Recherchez le maillot que vous possédez dans notre base de données, puis cliquez sur 'Ajouter à ma collection'. Vous pourrez ensuite renseigner tous les détails : taille, état, prix d'achat, etc.",
    },
    {
      question: "Puis-je partager ma wishlist pour Noël ou mon anniversaire ?",
      answer:
        "Absolument ! Créez votre wishlist, personnalisez-la avec un message, et générez un lien unique à partager avec vos proches. Ils pourront voir vos envies sans avoir besoin de créer un compte.",
    },
    {
      question: "Comment reconnaître un faux maillot ?",
      answer:
        "Consultez notre section 'Authentification' où vous trouverez des guides détaillés pour chaque marque. Nous vous expliquons comment vérifier les étiquettes, les coutures, les logos et autres détails qui différencient un vrai maillot d'une contrefaçon.",
    },
    {
      question: "Quels clubs et ligues sont disponibles ?",
      answer:
        "Notre base de données inclut des maillots de toutes les grandes ligues européennes (Ligue 1, Premier League, Liga, Serie A, Bundesliga) aisni que de nombreux clubs internationaux et ligues mineures. Nous ajoutons régulièrement de nouveaux maillots !",
    },
    {
      question: "Est-ce que mes données sont sécurisées ?",
      answer:
        "Oui, nous prenons la sécurité très au sérieux. Vos données sont hébergées en Europe (France) et protégées selon les normes RGPD. Vous restez propriétaire de votre collection et pouvez l'exporter à tout moment.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Tout ce que vous devez savoir sur Le Vestiaire
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left [&[data-state=open]>svg]:text-primary hover:[&>svg]:text-primary cursor-pointer">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
