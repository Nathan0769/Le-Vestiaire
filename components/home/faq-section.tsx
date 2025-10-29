"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";

export function FAQSection() {
  const t = useTranslations("HomePage.faq");

  const faqKeys = [
    "addToCollection",
    "shareWishlist",
    "authenticateJersey",
    "availableClubs",
    "dataSecurity",
  ] as const;

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqKeys.map((key, index) => (
            <AccordionItem key={key} value={`item-${index}`}>
              <AccordionTrigger className="text-left [&[data-state=open]>svg]:text-primary hover:[&>svg]:text-primary cursor-pointer">
                {t(`questions.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t(`questions.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
