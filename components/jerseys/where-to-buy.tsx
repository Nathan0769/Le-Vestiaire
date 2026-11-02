import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CFS_LOGO_URL, type WhereToBuy as WhereToBuyData } from "@/lib/where-to-buy";

interface WhereToBuyProps {
  data: WhereToBuyData;
}

// Rendu dans la fiche maillot (ISR) : aucune donnée de session, les offres sont
// régénérées par les crons de synchro via revalidateJerseysByIds.
export async function WhereToBuy({ data }: WhereToBuyProps) {
  if (!data) return null;
  const t = await getTranslations("Jerseys");

  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-border/50 min-w-0">
      <span className="text-sm font-medium text-muted-foreground shrink-0">{t("findOnCFS")}</span>
      {data.kind === "search" ? (
        <a
          href={data.url}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors flex items-center gap-1.5"
        >
          <span>Classic Football Shirts</span>
          <Image src={CFS_LOGO_URL} alt="Classic Football Shirts" width={16} height={16} className="object-contain" />
        </a>
      ) : (
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-1.5 min-w-0">
          {data.links.map((link) => (
            <a
              key={link.shop}
              href={link.url}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="group flex flex-col items-end text-right"
            >
              <span className="flex items-center gap-1.5 text-sm text-primary group-hover:text-primary/80 group-hover:underline transition-colors">
                <Image src={link.logoUrl} alt={link.name} width={16} height={16} className="object-contain" />
                <span>{link.name}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{link.price.toFixed(2)} €</span>
                {link.compareAtPrice !== null && (
                  <span className="ml-1 line-through">{link.compareAtPrice.toFixed(2)} €</span>
                )}
                {link.promoCode && <span className="ml-1">{t("promoCode", { code: link.promoCode })}</span>}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
